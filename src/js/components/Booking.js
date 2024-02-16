import  {select, templates, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;
    
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const notRepeatParam = settings.db.notRepeatParam;
    const repeatParam = settings.db.repeatParam;

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [  
        repeatParam,
        endDateParam,
      ],
    };

    //console.log('getData params: ', params);

    const urls = {
      booking:       settings.db.url + '/' + settings.db.bookings
                                     + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.events 
                                     + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};
    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    }
    //console.log(thisBooking.booked);
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = thisBooking.hourPicker.value; 

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable 
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      }
      else{
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
    this.tableSelector(false);
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = document.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = document.querySelector(select.booking.floorPlan);

  }

  tableSelector(reset){
    const thisBooking = this;
    const tableList = thisBooking.dom.tables;
    thisBooking.selectedTableArray = [];
    if(reset){
      for(let table of tableList){
        table.classList.remove(classNames.booking.tableSelected);
      }
    }
    thisBooking.dom.floorPlan.addEventListener('click', function(event){
      //console.log(event.target);
      if (event.target.classList.contains('table')) {
        const selectedTable = event.target;
        const selectedTableId = (event.target.getAttribute('data-table'));
        if(!selectedTable.classList.contains(classNames.booking.tableBooked)){
          for(let table of tableList){
            if(table.getAttribute('data-table') !== selectedTableId){
              table.classList.remove(classNames.booking.tableSelected);
            }
            if (thisBooking.selectedTableArray.length === 0 || thisBooking.selectedTableArray[0] !== selectedTableId) {
              thisBooking.selectedTableArray = [selectedTableId];
            } 
            else if (thisBooking.selectedTableArray[0] === selectedTableId) {
              thisBooking.selectedTableArray = [];
            }
            selectedTable.classList.toggle(classNames.booking.tableSelected);
          }
        }
      }
    });
  }

  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;
    const payload = {};

    payload.date = thisBooking.datePicker.value;
    payload.hour = utils.numberToHour(thisBooking.hourPicker.value);
    payload.duration = thisBooking.hoursAmount.value;
    payload.ppl = thisBooking.peopleAmount.value;
    payload.phone = thisBooking.dom.wrapper.querySelector(select.booking.phoneInput).value;
    payload.address = thisBooking.dom.wrapper.querySelector(select.booking.addressInput).value;

    const selectedTableElement = thisBooking.dom.wrapper.querySelector(select.booking.selectedTable);
    if (selectedTableElement !== null) {
      const tableId = selectedTableElement.getAttribute('data-table');
      if (tableId !== null && tableId !== 'null') {
        payload.table = parseInt(tableId);
      } else {
        payload.table = 0; // meaning any table or not selected
      }
    } else {
      payload.table = 0;
    }

    const checkboxes = thisBooking.dom.wrapper.querySelectorAll(select.booking.checkbox);
    payload.starters = [];
    for(let checkbox of checkboxes){
      //console.log(checkbox);
      if(checkbox.checked){
        payload.starters.push(checkbox.value);
      }
    }
    //console.log(payload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    
    fetch(url, options)
      .then(
        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table),
        thisBooking.updateDOM()
      );
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.submitButton = thisBooking.dom.wrapper.querySelector(select.booking.submitButton);

    thisBooking.dom.peopleAmount.addEventListener('updated', function(){});
    thisBooking.dom.hoursAmount.addEventListener('updated', function(){});
    thisBooking.dom.hourPicker.addEventListener('updated', function(){});
    thisBooking.dom.datePicker.addEventListener('updated', function(){});
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
      thisBooking.tableSelector(true);
    });
    thisBooking.submitButton.addEventListener('click',function(){
      event.preventDefault();
      thisBooking.sendBooking();
    });

  }
}

export default Booking;
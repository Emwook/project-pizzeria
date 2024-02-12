import {select, classNames, templates, settings} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';


class Product {
  constructor(id,data){
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
    thisProduct.prepareCartProduct();
  }
  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* create element using utils.createElementFromHtml */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }
  getElements(){
    const thisProduct = this;
  
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }
  initAccordion(){
    const thisProduct = this;

    /* START: add event listener to clickable trigger on event click */
    thisProduct.accordionTrigger.addEventListener('click', function(event) {
      /* prevent default action for event */
      event.preventDefault();

      /* find active product (product that has active class) */
      const products = document.querySelectorAll(select.all.menuProductsActive); 

      /* if there is active product and it's not thisProduct.element, remove class active from it */
      for (let activeProduct of products){
        if(activeProduct !== thisProduct.element){ 
          activeProduct.classList.remove('active');
        }
      }

      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle('active');
    });
  }
  initOrderForm(){
    const thisProduct = this;
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
    
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }
  processOrder(){
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    // set price to default price
    let price = thisProduct.data.price;

    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        // set a name for the class used in img element
        let selectedImageClassName = '.'+ paramId +'-'+ optionId;
        const imageElement = thisProduct.imageWrapper.querySelector(selectedImageClassName);

        // check if the ingredient is present in the form data
        if (!formData.hasOwnProperty(paramId)) {
          //brake the loop if it isnt
          continue;
        }

        const formDataParam = formData[paramId];

        // check if the form data has this option
        if (formDataParam.includes(optionId)) {
          // check if the option has an image
          if (imageElement) {
            //add 'active' class to the image
            imageElement.classList.add(classNames.menuProduct.imageVisible);
          }

          // check if it is a default option
          if (!option.default) {
            // increase the prrice
            price += option.price;
          }
        } 
        else {
          // Check if the image element exists
          if (imageElement) {
            // remove the 'active' class
            imageElement.classList.remove(classNames.menuProduct.imageVisible);
          }

          // check if the option is default
          if (option.default) {
            // decrease the price if so
            price -= option.price;
          }
        }
      }
    }
    thisProduct.priceSingle = price;
    /* multiply price by amount */
    price *= thisProduct.amountWidget.value;
    // update calculated price in the HTML
    thisProduct.priceElem.innerHTML = price;

    thisProduct.price = price;
    thisProduct.amount = thisProduct.amountWidget.value;
    thisProduct.name = thisProduct.data.name;
  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){thisProduct.processOrder();});
  }
  prepareCartProductParams() {
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};
  
    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      
      if (formData.hasOwnProperty(paramId)) {
        if (!params[paramId]) {
          params[paramId] = {
            'label': param.label,
            'options': {},
          };
        }
        for (let optionId in param.options) {
          const formDataParam = formData[paramId];
          if (formDataParam.includes(optionId)) {
            const productLabel = thisProduct.id;
            const url = settings.db.url + '/' + settings.db.products + '/' + productLabel;
            fetch(url)
              .then(function (rawResponse) {
                return rawResponse.json();
              })
              .then(function (parsedResponse) {
                const dataProduct = parsedResponse;
                const dataParam = dataProduct.params[paramId];
                const dataOption = dataParam.options[optionId].label;
                params[paramId]['options'][optionId] = dataOption;
              });
          }
        }
      }
    }
    return params;
  }
  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.name;
    productSummary.amount = thisProduct.amount;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = thisProduct.price;
    const params = thisProduct.prepareCartProductParams(); //change
    productSummary.params = params;
    return productSummary;
  }
  addToCart() {
    const thisProduct = this;
 
    //  app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    }
    );
    thisProduct.element.dispatchEvent(event);
  }
}

export default Product;
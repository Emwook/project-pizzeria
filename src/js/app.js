import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

const app = {
  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    thisApp.homeLinks = document.querySelectorAll(select.home.links);

    const idFromHash = window.location.hash.replace('#/','');

    let pageMatchingHash = thisApp.pages[0].id;

    for(let page of thisApp.pages){
      if(page.id == idFromHash){
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);

    for(let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const thisElement = this;
        event.preventDefault();

        const id = thisElement.getAttribute('href').replace('#','');

        thisApp.activatePage(id);

        window.location.hash = '#/' + id;
      });
    }

    for(let homeLink of thisApp.homeLinks){
      homeLink.addEventListener('click', function(event){
        const thisElement = this;
        event.preventDefault();

        const id = thisElement.getAttribute('href').replace('#','');
        thisApp.activatePage(id);

        window.location.hash = '#/' + id;
      });
    }
  },

  activatePage: function(pageId){
    const thisApp = this;

    for(let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    for(let link of thisApp.navLinks){
      link.classList.toggle(classNames.nav.active, link.getAttribute('href') == '#' + pageId);
    }
    
  },

  initMenu: function(){
    const thisApp = this;


    for(let productData in thisApp.data.products){
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function(){
    const thisApp = this;

    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.products;
    
    fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){

        //save parsedResponse at thisApp.data.products 
        thisApp.data.products = parsedResponse;

        //execute initMenu method
        thisApp.initMenu();
      });

  },

  initCart: function(){
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  },

  initBooking: function(){
    //const thisApp = this;

    const bookingContainer = document.querySelector(select.containerOf.booking);
    new Booking(bookingContainer);
  },

  init: function(){
    const thisApp = this; 

    thisApp.initData();
    thisApp.initCart();
    thisApp.initPages();
    thisApp.initBooking();
  },
};

app.init();

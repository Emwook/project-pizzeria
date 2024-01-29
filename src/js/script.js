/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

const select = {
  templateOf: {
    menuProduct: "#template-menu-product",
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product {
    constructor(id,data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.processOrder();

      console.log('new product: ', thisProduct);
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
            console.log('active products: ',activeProduct);
            activeProduct.classList.remove('active');
          }
        }

        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle('active');
      });
    }
    initOrderForm(){
      const thisProduct = this;
      //console.log('f1',thisProduct);
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
      });
    }
    processOrder(){
      const thisProduct = this;
      //console.log('f2',thisProduct);

      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('form data: ',formData);
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
            console.log('Ingredient not found in form data');
            //brake the loop if it isnt
            continue;
          }

          const formDataParam = formData[paramId];

          // check if the form data has this option
          if (formDataParam.includes(optionId)) {
            // check if the option has an image
            if (imageElement) {
              //add 'active' class to the image
              imageElement.classList.add('active');
              console.log('Image set to active');
            }

            // check if it is a default option
            if (!option.default) {
              // increase the prrice
              price += option.price;
              console.log('Price increased by:', option.price, 'New price:', price);
            }
          } 
          else {
            // Check if the image element exists
            if (imageElement) {
              // remove the 'active' class
              imageElement.classList.remove('active');
            }

            // check if the option is default
            if (option.default) {
              // decrease the price if so
              price -= option.price;
              console.log('Price decreased by:', option.price, 'New price:', price);
            }
          }
        }
      }
    // update calculated price in the HTML
    thisProduct.priceElem.innerHTML = price;
    }
  }

  const app = {
    initMenu: function(){
      const thisApp = this;

      console.log('thisApp.data: ',thisApp.data);

      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;

      thisApp.data = dataSource;
    },

    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
    },
  };

  app.init();
}

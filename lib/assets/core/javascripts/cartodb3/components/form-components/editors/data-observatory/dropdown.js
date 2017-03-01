var Backbone = require('backbone');
var _ = require('underscore');
var template = require('./dropdown.tpl');
var selectedItemTemplate = require('./dropdown-item.tpl');
var DropdownDialog = require('./dropdown-dialog');
var PopupManager = require('../../../popup-manager');

var ENTER_KEY_CODE = 13;

Backbone.Form.editors.DODropdown = Backbone.Form.editors.Base.extend({

  tagName: 'div',
  className: 'u-ellipsis Editor-formSelect',

  events: {
    'click .js-button': '_onButtonClick',
    'keydown .js-button': '_onButtonKeyDown',
    'focus .js-button': function () {
      this.trigger('focus', this);
    },
    'blur': function () {
      this.trigger('blur', this);
    }
  },

  options: {
    selectedItemTemplate: selectedItemTemplate
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    this._setOptions(opts);

    this.template = opts.template || template;
    this.dialogMode = this.options.dialogMode || 'nested';
    // this.collection = new CustomListCollection(this.options.options);
    this._initViews();

    this.setValue(this.model.get(this.options.keyAttr));

    this._initBinds();
  },

  _initViews: function () {
    var isLoading = this.options.loading;
    var isEmpty = !this.collection.length;
    var isDisabled = !isEmpty ? this.options.disabled : true;
    var name = this.model.get(this.options.keyAttr);
    var isNull = name === null;
    var label = isNull ? 'null' : name;
    var placeholder = this.options.placeholder;
    var typeLabel = this.options.keyAttr;

    this.$el.html(
      this.template({
        label: label,
        keyAttr: this.options.keyAttr,
        placeholder: placeholder,
        isDisabled: isDisabled,
        isLoading: isLoading,
        isEmpty: isEmpty,
        isNull: isNull
      })
    );

    if (isDisabled) {
      this.undelegateEvents();
    }

    this._dialog = new DropdownDialog({
      options: this.options.options
    });

    this._popupManager = new PopupManager(this.cid, this.$el, this._dialog.$el);
    this._popupManager.append(this.dialogMode);
  },

  _initBinds: function () {
    var hide = function () {
      this._dialog.hide();
      this._popupManager.untrack();
    }.bind(this);

    // this.collection.bind('change:selected', this._onItemSelected, this);
    this.applyESCBind(hide);
    this.applyClickOutsideBind(hide);
  },

  _onItemSelected: function (mdl) {
    this._dialog.hide();
    this._popupManager.untrack();
    this._renderButton(mdl).focus();
    this.trigger('change', this);
  },

  _onButtonClick: function (ev) {
    this._dialog.toggle();
    this._dialog.isVisible() ? this._popupManager.track() : this._popupManager.untrack();
  },

  _onButtonKeyDown: function (ev) {
    if (ev.which === ENTER_KEY_CODE) {
      ev.preventDefault();
      if (!this._dialog.isVisible()) {
        ev.stopPropagation();
        this._onButtonClick();
      } else {
        this._popupManager.track();
      }
    }
  },

  getValue: function () {
    var item = this.collection.getSelectedItem();
    if (item) {
      return item.getValue();
    }
    return;
  },

  setValue: function (value) {
    var selectedModel = this.collection.setSelected(value);
    if (selectedModel) {
      this._renderButton(selectedModel);
    }
    this.value = value;
  },

  _renderButton: function (mdl) {
    var button = this.$('.js-button');
    var data = _.extend({}, {label: mdl.getName()}, mdl.attributes);
    var $html = this.options.selectedItemTemplate(data);

    button
      .removeClass('is-empty')
      .html($html);

    return button;
  },

  remove: function () {
    this._popupManager && this._popupManager.destroy();
    this._dialog && this._dialog.clean();
    Backbone.Form.editors.Base.prototype.remove.call(this);
  }

});
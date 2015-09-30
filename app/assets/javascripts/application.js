// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery.cookie
//= require jquery_ujs
//= require turbolinks
//= require bootstrap
//= require jquery_nested_form
//= require underscore
//= require_tree .

(function($) {
    if (!$.outerHTML) {
        $.extend({
            outerHTML: function(ele) {
                var $return;
                if (ele.length === 1) {
                    $return = ele[0].outerHTML;
                }
                else if (ele.length > 1) {
                    $return = {};
                    ele.each(function(i) {
                        $return[i] = $(this)[0].outerHTML;
                    });
                }
                return $return;
            }
        });
        $.fn.extend({
            outerHTML: function() {
                return $.outerHTML($(this));
            }
        });
    }
})(jQuery);

// Code to deal with data-onclick-remote elements

$(document).on("click", "[data-onclick-remote]", function(e) {
    e.preventDefault();
    url = $(this).attr("data-onclick-remote");
    $.ajax({
      url: url,
      dataType: "script",
      type: "GET",
  });
});

// Code to deal with data-form-remote elements
// causes them to submit the form with id from data-form-remote
// to the url specificed by data-action or defaults to form action
// with the method data-method or defaults to form data-method or defaults to post
$(document).on("click", "button[data-form-remote]", function(e) {
  e.preventDefault();
  target = $(this);
  var form = $('#' + target.attr("data-form-remote"));
  var url = target.attr("data-action");
  if (typeof url === undefined || (! url)) {
    url = form.attr('action');
  }
  var method = target.attr("data-method");
  if (typeof method === undefined || (! method)) {
    method = form.attr('data-method');
  }
  if(typeof method === undefined || (! method)) {
    method = 'POST';
  }
  method=method.toUpperCase();
  $.ajax({
    url: url,
    dataType: "script",
    type: method,
    data: form.serialize()
  });
});

function addParameter(url, parameterName, parameterValue, atStart/*Add param before others*/){
    if (typeof(atStart)==='undefined') atStart = false;
    replaceDuplicates = true;
    var cl;
    var urlhash;
    if(url.indexOf('#') > 0){
        cl = url.indexOf('#');
        urlhash = url.substring(url.indexOf('#'),url.length);
    } else {
        urlhash = '';
        cl = url.length;
    }
    sourceUrl = url.substring(0,cl);

    var urlParts = sourceUrl.split("?");
    var newQueryString = "";

    if (urlParts.length > 1)
    {
        var parameters = urlParts[1].split("&");
        for (var i=0; (i < parameters.length); i++)
        {
            var parameterParts = parameters[i].split("=");
            if (!(replaceDuplicates && parameterParts[0] == parameterName))
            {
                if (newQueryString === "")
                    newQueryString = "?";
                else
                    newQueryString += "&";
                newQueryString += parameterParts[0] + "=" + (parameterParts[1]?parameterParts[1]:'');
            }
        }
    }
    if (newQueryString === "")
        newQueryString = "?";

    if(atStart){
        newQueryString = '?'+ parameterName + "=" + parameterValue + (newQueryString.length>1?'&'+newQueryString.substring(1):'');
    } else {
        if (newQueryString !== "" && newQueryString != '?') newQueryString += "&";
        newQueryString += parameterName + "=" + ( (typeof(parameterValue) === 'undefined') ? '' : parameterValue);
    }
    return urlParts[0] + newQueryString + urlhash;
}

function addParameters(init_url, hash) {
  var url = init_url;
  for(var key in hash) {
    url = addParameter(url, key, hash[key]);
  }
  return url;
}

function ResultsController(per_page) {
  if (typeof(per_page)==='undefined') per_page = 50;
  this.current_page = 0;
  this.num_pages = 0;
  this.num_items = 0;
  this.items_per_page = per_page;
  this.on_refresh_list = [];
  this._base_url = "";
  this._params = {};
}


Object.defineProperty(ResultsController.prototype, "params", {
  get: function() {return this._params;},
  set: function(p) {this._params = p;
                    delete this._params['_'];}
});

Object.defineProperty(ResultsController.prototype, "base_url", {
  get: function() {return this._base_url;},
  set: function(url) {this._base_url = url.split("?")[0];}
});


ResultsController.prototype.did_refresh = function() {
  for (var i=0; i<this.on_refresh_list.length; i++) {
    this.on_refresh_list[i]();
  }
};

ResultsController.prototype.refresh = function() {
  url = addParameters(this._base_url, this._params);
  $.getScript(url);
};

ResultsController.prototype.set_param = function(key, val) {
  this._params[key] = val;
};

ResultsController.prototype.delete_param = function(key, val) {
  delete this._params[key];
};

ResultsController.prototype.on_refresh = function(fun) {
  this.on_refresh_list.push(fun);
};

function SearchController(rcontrol, notification_container, template, search_action_container) {
  this.rcontrol = rcontrol;
  this.ncontainer = notification_container;
  this.template = _.template(template);
  this.params = {};
  sc = this;
  var cont = search_action_container;
  $(cont).on("click", "[data-search-submit]", function(e) {
    var scope = $(this).attr("data-search-scope");
    if (typeof scope === undefined || (! scope)) {
      scope = $('#' + $(this).attr("data-search-scope-ptr")).val();
    }
    var arg = $(this).attr("data-search-arg");
    if (typeof arg === undefined || (! arg)) {
      arg = $('#' + $(this).attr("data-search-arg-ptr")).val();
    }
  sc.search(scope,arg);
  });
}

SearchController.prototype.cancel_search = function(scope, arg) {
  this.rcontrol.delete_param(scope, arg);
  delete this.params[scope];
  this.rcontrol.refresh();
};

SearchController.prototype.add_notification = function(scope, arg) {
  var el = $(this.template({scope: scope, arg: arg}));
  var id = "my-id-" + (Math.floor(Math.random() * 26) + Date.now()).toString();
  el.attr("id", id);
  this.ncontainer.append(el);
  var sc = this;
  $('#' + id).find('.search-cancel').click(function(e) {
    e.preventDefault();
    sc.cancel_search(scope, arg);
    $('#' + id).remove();
  });
};

SearchController.prototype.search = function(scope, arg) {
  this.add_notification(scope, arg);
  this.rcontrol.set_param(scope, arg);
  this.params[scope] = arg;
  this.rcontrol.refresh();
};

SearchController.prototype.hidden_fields = function() {
  str="";
  for (var scope in this.params) {
    str += '<input type="hidden" name="' + scope + '" value="'+ this.params[scope] + '">';
  }
  return str;
};

function SelectController(container, rcontrol, scontrol) {
  this.rcontrol = rcontrol;
  this.container = container;
  if (typeof(scontrol)==='undefined') {
    this.scontrol = { hidden_fields: function() {return "";} };
  } else {
    this.scontrol = scontrol;
  }
  this.rcontrol.on_refresh($.proxy(this.refresh, this));
  this.container.find('.select-page-link').click($.proxy(this.select_page, this));
  this.container.find('.select-all-link').click($.proxy(this.select_all, this));
  this.container.find('.select-none-link').click($.proxy(this.select_none, this));
  this.container.find('.select-check-box').click($.proxy(this.select_some, this));
}

SelectController.prototype.refresh = function() {
  this.select_none();
  this.container.find('.select-check-box').click($.proxy(this.select_some, this));
};

SelectController.prototype.update_num_items= function() {
  num_items = this.rcontrol.num_items;
  this.container.find('.select-total-num-items').text(num_items);
};

SelectController.prototype.select_page = function() {
  this.container.find('.select-check-box').prop('checked', true);
  this.container.find('.select-page-link').hide();
  this.update_num_items();
  this.container.find('.select-all-link').show();
  this.container.find('.select-hidden-inputs').html('<input type="hidden" name="select_all" value="false">');
};

SelectController.prototype.select_none = function() {
  this.container.find('.select-check-box').prop('checked', false);
  this.container.find('.some-selected-links').show();
  this.container.find('.all-selected-links').hide();
  this.container.find('.select-page-link').show();
  this.container.find('.select-all-link').hide();
  this.container.find('.select-hidden-inputs').html('<input type="hidden" name="select_all" value="false">');
};

SelectController.prototype.select_some = function() {
  this.container.find('.some-selected-links').show();
  this.container.find('.all-selected-links').hide();
  this.container.find('.select-page-link').show();
  this.container.find('.select-all-link').hide();
  this.container.find('.select-hidden-inputs').html('<input type="hidden" name="select_all" value="false">');
};

SelectController.prototype.select_all = function() {
  this.container.find('.select-check-box').prop('checked', true);
  this.container.find('.some-selected-links').hide();
  this.update_num_items();
  this.container.find('.all-selected-links').show();
  this.container.find('.select-hidden-inputs').html(this.scontrol.hidden_fields() + '<input type="hidden" name="select_all" value="true">');
};

function ListDeleteController(container) {
  this.container = container;
  this.container.find('.delete-indicator').hide();
  this.DeletedItem = null;
  this.modal = container.find('.confirm-delete-modal').first();
  this.enable_button = this.container.find('.enable-delete-button').first();
  this.enable_button.click($.proxy(this.enable_delete, this));
  this.disable_button = this.container.find('.finish-delete-button').first();
  this.disable_button.click($.proxy(this.disable_delete, this));
  this.confirm_button = this.modal.find('.confirm-delete-button');
  this.refresh = this.disable_delete;
  this.disable_delete();
}

ListDeleteController.prototype.enable_delete = function() {
  this.refresh = this.enable_delete;
  this.container.find('.delete-indicator').show();
  this.enable_button.hide();
  this.disable_button.show();
  modal = this.modal;
  container = this.container;
  deletecontroller = this;
  this.container.find('.deleteable-element').off("click");
  this.container.find('.deleteable-element').click( function(e) {
    e.preventDefault();
    content = "";
    if ($(this).is('.deleteable-identifier')) {
      content = $(this).html();
    } else {
      content = $(this).find('.deleteable-identifier').first().html();
    }
    modal.find('.confirm-delete-content').html(content);
    modal.modal('show');
    url = $(this).is('.deleteable-href') ? this.href : $(this).find('.deleteable-href').attr("href");
    deletecontroller.DeletedItem = $(this);
    modal.find('.confirm-delete-button').first().click(function() {
      $.ajax({
        url: url,
        dataType: "script",
        type: 'DELETE'
      });
    });
  });
};

ListDeleteController.prototype.disable_delete = function() {
  this.refresh = this.disable_delete;
  this.container.find('.delete-indicator').hide();
  this.container.find('.deleteable-element').off("click");
  this.enable_button.show();
  this.disable_button.hide();
  modal = this.modal;
  container = this.container;
  this.container.find('.deleteable-element').click( function(e) {
    e.preventDefault();
    url = $(this).is('.deleteable-href') ? this.href : $(this).find('.deleteable-href').attr("href");
    $.getScript(url);
  });
};

$.cookie.json = true; // use json to store cookie information
// FLASH NOTICE ANIMATION
var fade_flash = function() {
  $("#flash_notice").delay(5000).fadeOut("slow");
  $("#flash_alert").delay(5000).fadeOut("slow");
  $("#flash_error").delay(5000).fadeOut("slow");
  $("#flash_success").delay(5000).fadeOut("slow");
};

var show_ajax_flash = function(msg, type) {
  switch(type) {
    case "error":
      $("#flash-message").html('<div id="flash_error" class="alert alert-danger">'+msg+'</div>');
      break;
    case "alert":
      $("#flash-message").html('<div id="flash_alert" class="alert alert-warning">'+msg+'</div>');
      break;
    case "notice":
      $("#flash-message").html('<div id="flash_notice" class="alert alert-info">'+msg+'</div>');
      break;
    default:
      $("#flash-message").html('<div id="flash_success" class="alert alert-success">'+msg+'</div>');
  }
    fade_flash();
};

$(document).ajaxComplete(function(event, request) {
    var msg = request.getResponseHeader('X-Message');
    var type = request.getResponseHeader('X-Message-Type');
    if (msg) show_ajax_flash(msg, type); //use whatever popup, notification or whatever plugin you want
});

// Code to enable multiple modals
$(document).ready(function() {
  fade_flash();
  // Code to enable multiple modals
  $('.modal').on('hidden.bs.modal', function( event ) {
    $(this).removeClass( 'fv-modal-stack' );
    $('body').data( 'fv_open_modals', $('body').data( 'fv_open_modals' ) - 1 );
  });

  $( '.modal' ).on( 'shown.bs.modal', function ( event ) {
    // keep track of the number of open modals
    if ( typeof( $('body').data( 'fv_open_modals' ) ) == 'undefined' ) {
     $('body').data( 'fv_open_modals', 0 );
    }

    // if the z-index of this modal has been set, ignore.
    if ( $(this).hasClass( 'fv-modal-stack' ) ) {
      return;
    }

    $(this).addClass( 'fv-modal-stack' );
    $('body').data( 'fv_open_modals', $('body').data( 'fv_open_modals' ) + 1 );
    $(this).css('z-index', 1040 + (10 * $('body').data( 'fv_open_modals' )));
    $( '.modal-backdrop' ).not( '.fv-modal-stack' ).css( 'z-index', 1039 + (10 * $('body').data( 'fv_open_modals' )));
    $( '.modal-backdrop' ).not( 'fv-modal-stack' ).addClass( 'fv-modal-stack' );
  });

});







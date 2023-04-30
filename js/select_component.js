// utility to get the form
var getForm = (function() {
    return function(formid) {
        return (!formid) ? $('form:first') : $(formid);
    }
})();

// .active element underlines the field
function _setActive(which) {
    if (which.closest('.form-element, .form-radio, .form-map-legend, .form-checkbox, .form-switch').hasClass('active')) {
        return;
    } else {
        _unsetActive();
    }
    which.closest('.form-element, .form-radio, .form-map-legend, .form-checkbox, .form-switch').addClass('active');
    // typeahead has a hidden radio selector for new entries, no <legend> text that highlights, so keep the parent .form-element highlighted
    which.closest('.form-element > .form-radio').parent().addClass('active');
}

function _unsetActive() {
    $('.form-element, .form-radio, .form-map-legend, .form-checkbox, .form-switch').removeClass('active');
}

function makeOption(select, input, option, id, i, isoptgroup) {
    isoptgroup = (!isoptgroup) ? false : isoptgroup;

    var hasCheckbox = (select.data('nocheckbox') !== undefined) ? '' : '<i></i>';
    var name = select.attr('name');
    var desc = option.data('description');
    var icon = option.data('icon');
    var iconclass = option.data('iconclass');
    // if the option is [label] its an optgroup as they require a label attr
    var text = (option.is('[label]')) ? option.attr('label') : option.text();

    if (desc !== undefined) {
        text += ' <small>' + desc + '</small>';
    }
    if (icon !== undefined) {
        var _class = '';
        if (iconclass !== undefined) {
            _class = iconclass;
        }
        text = '<span class="' + _class + '"><i data-icon="' + icon + '"></i></span>' + text;
    }
    if (isoptgroup && icon === undefined) {
        text = '<span class="clear"><i data-icon="group_work"></i></span>' + text
    }


    var label = $('<label role="option">')
        .attr({
            'id': 'listbox_' + id + '_option_' + i
        })
        .append(hasCheckbox + '<span>' + text + '</span><div class="option-bg"></div>');

    var type = (select.is('[multiple]')) ? $('<input type="checkbox">') : $('<input type="radio">');

    type.attr('name', name)
        .val(option.val())
        .on('focus', function() {
            input.attr('aria-activedescendant', label.attr('id'));
        })
        .on('change', function() {
            selectChange(type);
        });

    if (option.is('[disabled]') || option.is('optgroup')) {
        type.attr('disabled', 'disabled').prop('disabled', true);
        label.attr('disabled', 'disabled');
    }
    if (option.is('optgroup')) {
        label.addClass('optgroup');
    }
    //preferred to allow hidden input and/or placeholder text until a selection is made
    // only trigggers if selected attribute is present
    if (option.is('[selected]')) {
        //console.log(option);
        type.attr('checked', 'checked').prop('checked', true);
        label.attr('aria-selected', true);
    }else{
        label.attr('aria-selected', false);
    }
    /*:selected set by dom - if you use this, the select auto selects the first item in the list if no select attribute exists on the options
    works exactly like a <select> default behavior, selecting the first item */
    /************
    if(option.is(':selected')){
        box.attr('checked', 'checked').prop('checked', true);
        label.attr('aria-selected', true);        
    }
    ************/

    label.prepend(type);
    return label;
}

/*this does all the work to convert a <select> element into a checkbox, radio modal*/
var selectMachine = (function() {
    return function(identifier) {
        if ($(identifier).length === -1) {
            // do the elements exist?
            console.warn('no matching elements found');
            return;
        }
        if(!$(identifier).is('select')){
            // are the elements <select>'s?
            console.warn('selectMachine() only works on <select> form elements');
            return;
        }
        // continue...
        console.log('<select> present, converting...');
        
        var selects = $(identifier);

        /*METHODS*/
        selects.each(function() {

            var select = $(this);

            var el = select.closest('.form-element')

            // gather existing values
            var name = select.attr('name');
            
            if (name === undefined) {
                console.warn('select MUST have unique name attribute assigned');
            }
            var id = (select.is('[id]')) ? select.attr('id') : name;

            // make a new input
            var input = $('<input readonly>')
                .addClass(select.attr('class'))
                .addClass('nodrag')
                .attr({
                    'id': id,
                    'placeholder': 'Choose...',
                    'aria-label': 'Choose option from the list',
                    'aria-autocomplete': 'list',
                    'aria-controls': 'listbox_' + id
                })
                .on('click', function() {
                    openSelect($(this));
                    _setActive($(this));
                })
                .on('focus', function(){
                    _setActive($(this));
                })
                .on('blur', _unsetActive)
                .on('keydown', function(e){
                    if (e.keyCode == 32 || e.keycode == 13 || e.keyCode == 39 || e.keyCode == 40) {
                        //console.log('(space), enter', 'arrow=left', 'arrow-down');
                        e.preventDefault();
                        $(e.target).click();
                       // return false;
                    }
                });

            if (select.is('[style]')) {
                input.attr('style', select.attr('style'));
            }
            
            if (select.is('[multiple]')) {
                var target = (select.is('[data-target]')) ? select.data('target') : false;
                if (target) {
                    input.attr('data-target', target).data('target', target);
                }
                var chipclass = (select.is('[data-chipclass]')) ? select.data('chipclass') : false;
                if (chipclass) {
                    input.attr('data-chipclass', chipclass).data('chipclass', chipclass);
                }
            }

            if (select.is('[required]')) {
                input.attr({'required': 'required','aria-required':'true'});
            }

            var button = $('<button>')
                .attr({
                    'tabindex': '-1',
                    'type': 'button',
                    'aria-label': 'Click to open options'
                })
                .addClass('select')
                .html('<i data-icon="arrow_drop_down"></i>')
                .on('click', function() {
                    openSelect($(this));
                    _setActive($(this));
                })
                .on('focus', function() {
                    _setActive($(this));
                })
                .on('blur', _unsetActive);

            if (select.is('[disabled]')) {
                input.attr('disabled', 'disabled').prop('disabled', true);
                button.attr('disabled', 'disabled').prop('disabled', true);
            }
            var action = $('<span class="select-element-action">').append(button);
            
            var listbox = $('<div class="select-content nodrag" role="listbox">').attr('id', 'listbox_' + id);

            select.children().each(function(i) {
                // check type for option and optgroup
                if ($(this).is('option')) {
                    //console.log('im an option');
                    var option = $(this);
                    listbox.append(makeOption(select, input, option, id, i));
                }
                if ($(this).is('optgroup')) {
                    //console.log('im an optgroup');
                    var optgroup = $(this);
                    listbox.append(makeOption(select, input, optgroup, id, i));

                    optgroup.children().each(function(j) {
                        var option = $(this);
                        listbox.append(makeOption(select, input, option, id, i + '_' + j, true));
                    });
                }
            });
            var dialog = $('<div class="select-modal" aria-modal="true" role="dialog">');
            dialog.append(listbox);

            if(el.length > 0) {
                el.attr({
                    'role':'combobox', 
                    'aria-expanded':'false',
                    'aria-haspopup': 'listbox',
                    'aria-owns': 'listbox_' + id
                });
                el.append(input).append(action).append(dialog);
                // ok we got it all remove the source select
                select.remove();
            }else{
                console.warn('%s is not nested in .form-element,... Using default', el.context);
            }
            
            // ok, now we need to trigger the initial value for selects
            dialog.find('label[aria-selected] > input:checked').each(function() {
                selectChange($(this));
            });
            
            // after the original select is gone, (it may have been nested inside a label) build a replacement 
            var orig_label = el.find('label:not([role="option"]):first');
            var label_text = orig_label.text();
            // get rid of orig label
            orig_label.remove();

            // make a replacement label for the existing one.
            var select_label = $('<label>').attr('for', id).text(label_text);
            
            if (input.is('[disabled]')) {
                select_label.removeAttr('for'); // prevent clicking label from opening the modal
            }
            el.prepend(select_label);
        });
    };
})();

// we listen to this object, if empty, no modal is showing 
var g_select_modal = {};

// window listeners when select modal is open
$(window).scroll(function(e) {
    if (!jQuery.isEmptyObject(g_select_modal)) {
        removeSelect(g_select_modal);
    }
});
$(window).on('click keydown', function(e) {
    if (!jQuery.isEmptyObject(g_select_modal)) {
        //click modal area
        if (e.target === g_select_modal.get(0)) {
            removeSelect(g_select_modal);
        }

        //keydown
        if (e.shiftKey && e.keyCode == 9 || e.keyCode == 9 || e.keyCode == 27) {
            //console.log('shift+tab, tab, esc');
            removeSelect(g_select_modal);
        } else if (e.keyCode == 13 || e.keyCode == 32) {
            //console.log('enter, space');
            e.preventDefault();
            $(e.target).click();
        }

        // overrides
        if (e.keyCode == 38 || e.keyCode == 37 || e.keyCode == 33) {
            //console.log('arrowUp, arrowRight, pageUp');
            return focusSelectInput(e, 'prev');
        } else if (e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 34) {
            //console.log('arrowDown, arrowLeft, pageDown');
            return focusSelectInput(e, 'next');
        }

        // space enter or click should select option close modal if single select
        if(e.target.type == 'radio'){
            if(e.keyCode == 13 || e.keyCode == 32 || e.type == 'click'){
               //console.log('enter, space, click'); 
               removeSelect(g_select_modal);
            }
        }
    }
});

// show the modal
function addSelect(dialog) {
    dialog.addClass('show-select-modal').find('.select-content').addClass('show-select');
}

// hide the modal
function removeSelect(dialog) {
    if(!dialog || jQuery.isEmptyObject(dialog)) return;
    // focus on the select button upon close
    var el = dialog.closest('[role="combobox"]');
    el.find('input[readonly]').trigger('focus');
    el.attr('aria-expanded','false');
    // hide the modal
    dialog.removeClass('show-select-modal').find('.select-content').removeClass('show-select');
    g_select_modal = {};
}

// open the select modal
function openSelect($caller) {
    var el = $caller.closest('[role="combobox"]');
    
    el.attr('aria-expanded','true');

    g_select_modal = el.find('.select-modal')
    
    addSelect(g_select_modal);

    // this shows as 0 if hidden, 52px is expected 1 extra px takes care of 1 px bottom border in css
    var label_height = g_select_modal.find('label:not(:hidden):first').prop('scrollHeight') + 1;
    //console.log(label_height);
    var max_avail = Math.floor(window.innerHeight / label_height);
    // JQUERY BUG? $(window).height() defaults to document height, use the native window.innerHeight to get viewport height

    var option_count = g_select_modal.find('label[role="option"]').length;
    var max_options = (option_count > max_avail) ? max_avail : option_count;

    // set some css / multiply height by items to show
    g_select_modal.find('.select-content')
        .css({
            'max-height': (max_options * label_height) + 'px'
        });

    // focus order 
    g_select_modal.find('[name]:not(:disabled):first, [name]:checked').focus();
}

// actions that take place when a radio or checkbox is changed, sets chip
// -- ALWAYS set .prop('checked', bool) on the radio or checkbox (which) before calling this function --//
function selectChange(which) {
    //console.log('change logged');
    var el = which.closest('[role="combobox"]');
    // clear all previous chips
    el.find('dt').remove();
    var input = el.find('[readonly]');
    var chipclass = (input.data('chipclass') !== undefined) ? input.data('chipclass') : 'chip';
    var count = 0,
        targetid;

    if (input.data('target') !== undefined) {
        targetid = input.data('target').replace('#', '');
        if ($('#' + targetid).length == 0) {
            var list = $('<dl class="chips">').attr('id', targetid);
            el.append(list);
        } else {
            $('#' + targetid).addClass('chips');
        }
    }

    el.find('[type="radio"], [type="checkbox"]')
        .each(function() {
            if ($(this).is(':checked')) {
                //console.log('found checked');
                $(this).closest('label[role="option"]')
                    .attr({
                        'aria-selected': 'true'
                    });

                // if checkbox, add to chip list
                if ($(this).is('[type="checkbox"]')) {
                    // get the chipclass attribute

                    var chiplist = $('<dt class="' + chipclass + '">' + findSelectText($(this), 'text') + '</dt>');
                    var closechip = $('<button>')
                        .attr({
                            'type': 'button',
                            'title':'Remove selection'
                        })
                        .addClass('closechip round')
                        .html('<i data-icon="close"></i>')
                        .on('focus', _unsetActive);

                    chiplist.append(closechip);

                    // append <dt> to <dl>
                    $('#' + targetid).append(chiplist);
                    // update the hidden form field reflecting the selection only if a [data-target] is on element
                    if ($('#' + targetid).length > 0) {
                        setChipArray(targetid);
                    }
                    count++;
                }
            } else {
                $(this).closest('label[role="option"]').attr({
                    'aria-selected': 'false'
                });
            }
        });

    // aria needs to know which item (label id) is active
    var curr_active = which.parent().attr('id');
    
    if (which.is('[type="radio"]')) {
        // radio (single select)
        input.val(findSelectText(which, 'text')).attr('aria-activedescendant', curr_active);

    } else {
        // checkbox (multiple select)
        if (count > 0) {
            input.val(count + ' selected').attr('aria-activedescendant', curr_active);
        } else {
            input.val('').removeAttr('aria-activedescendant');
            setChipArray(targetid);
        }
    }
}

// called by window keydown, click when select is open
function focusSelectInput(e, dir) {
    var el = $(e.target);
    // make an array of input elements
    var options = el.closest('.select-modal').find('input:not([disabled])');
    // loop through the array
    options.each(function(i) {
        var curr = (el.get(0) == $(this).get(0));
        var first = 0;
        var last = options.length - 1;

        if (dir == 'next') {
            if (curr && i != last) {
                $(options[i + 1]).focus();
            } else if (curr && i == last) {
                // if looping is preferred
                //$(options[first]).focus();
                return;
            }
        } else {
            if (curr && i != first) {
                $(options[i - 1]).focus();
            } else if (curr && i == first) {
                //if looping is preferred
                //$(options[last]).focus();
                return;
            }
        }

    });
    return false;
}

// get either text contents or value, defaults to value
function findSelectText(which, key) {
    key = (key !== undefined) ? key : '';

    var small = which.parent().find('small');//get the descriptive text string in contents
    var all = which.parent().text();// get the entire text string in contents
    //console.log(all);
    var contents = (!small) ? all.trim() : all.replace(small.text(), '').trim();// only use contents without description and trim whitespace
    var value = (!which.attr('value')) ? contents : which.val();// if no value, use contents (w3)
    if (key == 'text') {
        value = contents;
    }
    return value;
}

// mutiple select(checkboxes) show a chip in the list
function setChipArray(targetid) {
    var arr = '';
    // values go into the hidden <input>
    $('#' + targetid).closest('[role="combobox"]').find('label[aria-selected]> input:checked')
        .each(function() {
            var text = $(this).val();
            arr += text.trim() + ';';
        });
    _updateHidden(arr, targetid);
}

// Remove chip
$(document).on('click', '.closechip', function() {
    
    var value = $(this).parent().text(); // str includes the x
    var close_x = $(this).parent().find('.closechip i').text(); // isolate the x
    value = value.replace(close_x, ''); //remove the x
    //console.log(value.trim());

    var checked = $(this).closest('[role="combobox"]').find('label[aria-selected]> input:checked');
    checked.each(function() {
        //console.log('%s == %s ?',findSelectText($(this),'text'),value.trim())
        if (findSelectText($(this), 'text') == value.trim()) {
            //console.log('YES!');
            $(this).prop('checked', false).removeClass('-hasvalue');
            selectChange($(this));
            // get the closest closechip button and focus
            $(this).closest('[role="combobox"]').find('.closechip:first').trigger('focus');
        }
    });
});

// hidden inputs, you can choose a form if the form element is outside the form
function _updateHidden(val, target, formid) {
    var form = (!formid) ? getForm() : getForm(formid);

    if ($('[name="' + target + '"]') !== undefined) {
        $('[name="' + target + '"]').remove();
    }
    $('<input>').attr({
            'type': 'hidden',
            'name': target
        }).val(val).appendTo(form);
}

/* START snackbar */
var createSnackbar = (function() {
    // Any snackbar that is already shown
    var previous = null;
    return function(message, actionText, action) {
        if (previous) {
            previous.dismiss();
        }
        var snackbar = document.createElement('div');
        snackbar.className = 'paper-snackbar';
        snackbar.dismiss = function() {
            this.style.opacity = 0;
            this.style.zIndex = -1;
            this.parentElement.style.opacity = 0;
        };
        snackbar.innerHTML = message; // allows icon to be included
        if (actionText) {
            if (!action) {
                action = snackbar.dismiss.bind(snackbar);
            }
            var actionButton = document.createElement('button');
            actionButton.className = 'action';
            actionButton.innerHTML = actionText;
            actionButton.addEventListener('click', action);
            snackbar.appendChild(actionButton);
        }
        setTimeout(function() {
            if (previous === this) {
                previous.dismiss();
            }
        }.bind(snackbar), 7000);

        snackbar.addEventListener('transitionend', function(event) {
            if (event.propertyName === 'opacity' && this.style.opacity === '0') {
                this.parentElement.removeChild(this);
                if (previous === this) {
                    previous = null;
                }
            }
        }.bind(snackbar));

        var floatframe = document.createElement('div');
        floatframe.className = 'paper-floatframe';

        floatframe.addEventListener('transitionend', function(event) {
            if (event.propertyName === 'opacity' && this.style.opacity === '0') {
                this.parentElement.removeChild(this);
            }
        }.bind(floatframe));

        floatframe.style.opacity = 1;
        previous = snackbar;

        floatframe.appendChild(snackbar);
        document.body.appendChild(floatframe);

        // In order for the animations to trigger, I have to force the original style to be computed, and then change it.
        getComputedStyle(floatframe).bottom;
        snackbar.style.bottom = '0px';
        snackbar.style.opacity = 1;
        snackbar.style.zIndex = 1;
    };
    /* usage 
    var longMessage = "This is a longer message that won't fit on one line. It is, inevitably, quite a boring thing. Hopefully it is still useful.";
    var shortMessage = 'Your message was sent';
    document.getElementById('single').addEventListener('click', function() {
      createSnackbar(shortMessage);    
    });
    document.getElementById('multi').addEventListener('click', function() {
      createSnackbar(longMessage);    
    });
    document.getElementById('singleaction').addEventListener('click', function() {
      createSnackbar(shortMessage, 'Dismiss');    
    });
    document.getElementById('multiaction').addEventListener('click', function() {
      createSnackbar(longMessage, 'Wot?', function() { alert('Moo!'); });    
    }); 
    */
})();
/* END snackbar */
/* START JQUERY SPECIFIC CODE */
jQuery(document).ready(function($) {

    /* typeahead */
    var eHeight = 0,eTop = 0,box = 0, resultParent;
    
    // typeahead called by object, node is a jquery node representing the input
    function watchTypeahead(node, resultCount) {
        eTop = node.offset().top; //get the offset top of the <input>
        eHeight = node.prop('scrollHeight') + 1; //get the height of the <input> add 1 so highlight bar shows

        // wait for the DOM to update
        window.setTimeout(function() {
            // the el needs some basic aria features
            var el = node.closest('.form-element');
            // typed in but nothing in results
            if (resultCount === 0) {
                el.attr('aria-expanded', false).addClass('-isnew');
            } else {
                el.attr('aria-expanded', true).removeClass('-isnew');
            }
            
            // nothing typed in
            if (node.val() === '') {
                el.attr('aria-expanded', false).removeClass('-isnew');
            }
            
            var list_id = 'list_' + node.attr('name');
            
            var list = el.find('.typeahead__list').attr({'id': list_id, 'role': 'listbox'});// ul
            var item = list.find('li').each(function(i){
                $(this).attr({
                    'id': list_id + '_item_' + i,
                    'role': 'option'
                });// li
            });
            // the initial result containing <div> set position under <input>
            resultParent = list.parent();
            
            resultParent
                .css({
                    'top': eHeight + 'px'
                })
                .addClass('ease');
            // get an <li> item height
            var itemHeight = list.find('li:first').prop('scrollHeight');
            // li height * number of results
            var resultHeight = itemHeight * resultCount;
            // limit number visible
            var itemsToShow = 5;
            // li height * 5 (6px is a border adjustment)
            var maxHeight = (itemHeight * itemsToShow) + 6;
            // restrict box height
            list.css('max-height', maxHeight + 'px');
            // we need an easy way to sense the actual height for scrolling
            if (resultHeight > maxHeight) {
                box = maxHeight;
            } else {
                box = resultHeight;
            }
            setBoxPosition();
        }, 50);
    }

    // where the results box opens, (above/below the <input>) based on element position in window
    function setBoxPosition() {
        var currPos = (eTop - $(window).scrollTop());
        var boxPosition = $(window).height() - box - eHeight;
        if (resultParent !== undefined) {
            if (currPos < boxPosition) {
                //console.log('display below ', box);
                resultParent.css({
                        'top': eHeight + 'px'
                    });
            } else {
                //console.log('display above ', box);
                resultParent.css({
                        'top': ((box - 2) * -1) + 'px'
                    });
            }
        }
    }
    
    // reposition typeahead results box when window is scrolled
    // also look for open modal and close it
    $(window).scroll(function(e) {
        setBoxPosition();
    });

    // radio buttons get selected every time an item from typeahead is. 
    function setRadios(node, group) {
        var el = node.closest('.form-element');
        el.find('.form-radio input')
            .each(function() {
                if ($(this).val() == group) {
                    $(this).prop('checked', true).attr('aria-checked',true);
                } else {
                    $(this).prop('checked', false).removeAttr('aria-checked');
                }
            });
    }
    /* end typeahead */

    // utility to get the form
    var getForm = (function(){
         return function(formid) {
             return (!formid) ? $('form:first') : $(formid);
         } 
    })();

    /* UNIQUE ID*/
    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    
    // make the hidden uid on load
    var uuid = guid();
    
    updateHidden(uuid, 'uid');

    // jsbarcode is hosted elsewhere 
    try{
        // barcode usage https://github.com/lindell/JsBarcode
        JsBarcode("#code128")
            .code128(uuid, {
                format: "CODE128C",
                ean128: true,
                height: 40
            })
            .render();
    }catch(err){
        console.warn(err);
        $('#code128').parent().parent().css('display','none');
    } 
    /* END UNIQUE ID */

    // date
    function today() {
        // auto start the date at today
        var d = new Date();
        var mm = d.getMonth() + 1; //January is 0!
        var yyyy = d.getFullYear();
        var dd = d.getDate();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        return yyyy + '-' + mm + '-' + dd;
    }


    // file
    $.fn.textWidth = function(text, font) {

        if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);

        $.fn.textWidth.fakeEl.text(text || this.val() || this.text() || this.attr('placeholder')).css('font', font || this.css('font'));
        
        return $.fn.textWidth.fakeEl.width();
    };

    function makeImage(input_el) {
        if (input_el.val() === '') {
            return false;
        }
        // prep the name parts
        var fullname = extractFilename(input_el.val());
        var name_arr = fullname.split('.');
        var ext_text = '.' + name_arr[name_arr.length - 1];
        name_arr.pop();
        var name_noext = name_arr.join('.');

        var el = input_el.closest('.form-element').removeClass('form-has-error');
        // show the attribute and discription fields
        el.closest('section').find('.form-image-tagline').css('display', 'block');
        // if the source if [type="file"] we need to move the <label>, 
        // this is done by classing the file back into a form element field
        input_el.addClass('form-element-field');

        var flex = el.find('.form-input-flex');
        var input = flex.find('input:first')
            .val(name_noext)
            .on('input', function() {
                // clear space on front or back of string
                $(this).val($(this).val().trim());
                // uses my jquery built function 'textWidth'
                var inputWidth = $(this).textWidth();
                $(this).css({
                        width: inputWidth + 5
                    });
                if (inputWidth > $(this).parent().width()) {
                    $(this).css('text-overflow', 'ellipsis');
                } else {
                    $(this).css('text-overflow', 'clip');
                }
                updateHidden($(this).val().trim() + ext_text, 'imgtitle');
            })
            .on('change', function() {
                if ($(this).val() === '') {
                    clearImage(input_el);
                }
            })
            .attr('tabindex', 0)
            .addClass('-hasvalue')
            .trigger('input');

        var ext = flex.find('.ext')
            .text(ext_text)
            .attr('style', '')
            .on('click', function() {
                $(this).prev().find('input').select();
            });

        var trashbtn = $('<button>')
            .attr({
                'type': 'button',
                'title': 'Delete',
                'aria-label': 'Delete'
            })
            .addClass('trash')
            .html('<i data-icon="delete"></i>')
            .on('click', function() {
                clearImage(input_el);
            })

        el.find('.form-element-action').prepend(trashbtn);

        // ready the image in <dt>
        var blob = $('<img>')
            .addClass('preview blob')
            .attr({
                'src': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='
            });
        var dt = $('<dt>').append(blob);

        // ready the hint
        var hint = $('<div>')
            .addClass('dimension')
            .html('<small id="dimension" class="form-element-hint"></small>');

        // ready the edit tools area 
        var tools = $('<div>')
            .addClass('tools');

        // put it all together
        $(input.data('target')).append(dt).append(hint).append(tools);

        // select all text in the input
        ext.trigger('click');
    }

    function clearImage(input_el) {
        var el = input_el.closest('.form-element');
        input_el = (input_el.is('[type="file"]')) ? input_el : el.find('[type="file"]:first');
        input_el.removeAttr('disabled');
        input_el.removeClass('form-element-field');
        // all inputs
        el.find('input').val('').removeClass('-hasvalue');
        // identify the text input
        var input = el.find('input[type="text"]');
        // reset the URL paste bit that was there on load
        input.attr({
                'tabindex': '-1',
                'style': ''
            })
            .on('click', function() {
                // open the file picker on click
                if ($(this).val() !== '') return;
                $(this).closest('.form-element').find('.openfile').trigger('click');
            })
            .on('keypress', function(e) {
                var el = $(this).closest('.form-element');
                var ext = el.find('.ext').text();
                //console.log(ext);
                if ($(this).val() === '' && ext === '') {
                    e.preventDefault();
                    return false;
                }
            })
            .on('input', function() {
                $(this).off('input');
                var url = $(this).val();
                if (url !== '') {
                    makeImage($(this));
                    readURL($(this), url);
                } else {
                    clearImage($(this));
                }
            })
            .attr('placeholder', 'paste image link here');
        el.find('.ext').text('').css('display', 'none');
        el.find('.trash').remove();
        el.find('.form-element-list').html('');
        el.removeClass('form-has-error');
        var taglines = el.closest('section').find('.form-image-tagline');
        // reset attribute and
        taglines.attr('style', '').find('input:first').val('').removeClass('-hasvalue');
        el.find('.paste').focus();
    }

    function extractFilename(fullPath) {
        var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
        var filename = fullPath.substring(startIndex);
        if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
            filename = filename.substring(1);
        }
        return filename;
    }

    function readFILE(input, el) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                insertBlob($(input), e.target.result);
            };
            var img = input.files[0];
            var msg = '<i data-icon="report_problem"></i>Whoops! That is not an image.';
            //console.log(img);
            try{
                console.log('confirming:', img.type);
                if (!img.type.match('image.*')) {
                    createSnackbar(msg, 'Dismiss');
                    el.find('.trash').trigger('click');
                    return;
                }
            }catch(e){
                console.log(e);
                // Edge
                createSnackbar(msg, 'Dismiss');
                return;
            }
            reader.readAsDataURL(img);
        }
    }

    function readURL(input, pastedData) {
        console.log('pastedData', pastedData);
        var el = input.closest('.form-element');
        var newUrl = sanitizeURL(pastedData);
        // check to see if data image blob
        if (newUrl.substring(0, 11) === 'data:image/') {
            insertBlob(input, pastedData);
            return;
        }
        // check to see if valid url
        if (!validURL(newUrl)) {
            fileSnackbar('Unsupported link', el);
        } else {
            // url string
            var request = new XMLHttpRequest();
            request.open('GET', newUrl, true);
            request.responseType = 'blob';
            request.onload = function() {
                var reader = new FileReader();
                reader.onload = function(e) {
                    insertBlob(input, e.target.result);
                };
                var img = request.response;
                console.log('confirming:', img.type);
                if (!img.type.match('image.*')) {
                    createSnackbar('<i data-icon="report_problem"></i>Whoops! That is not an image.', 'Dismiss');
                    el.find('.trash').trigger('click');
                    return;
                }
                reader.readAsDataURL(img);
            };
            request.onerror = function() {
                fileSnackbar('Protected image', el);
                el.find('.openfile').trigger('focus');
            };
            request.send();
        }
    }

    function fileSnackbar(text, el) {
        createSnackbar('<i data-icon="report_problem"></i>' + text + '. Try saving the image then use "Open files" to add.', 'Dismiss');
        el.find('.trash').trigger('click');
    }

    function sanitizeURL(url) {
        if (url.substring(0, 4) === '<img') {
            return $(url).attr('src');
        } else if (url.substring(0, 11) === 'data:image/') {
            return url;
        } else if (url.substring(0, 4) === 'http') {
            var protocol = url.split('://')[0];
            //console.log('protocol', protocol);
            var path = url.split('://')[1];
            //console.log('working path', path);
            // isolate query
            var query = path.split('?');
            if (query.length == 2) {
                path = query[0];
                query = query[1];
            } else {
                query = '';
            }
            //console.log('working path after query',path);
            //console.log('query',query);
            // now lets look at sub directories
            var subfolders = path.split('/');
            //console.log('subfolders',subfolders);
            // the first is actually the host
            var host = protocol + '://' + subfolders[0];
            //console.log('host',host);
            subfolders.shift();
            //console.log('subfolders minus host',subfolders)
            for (var i = 0; i < subfolders.length; i++) {
                subfolders[i] = encodeURIComponent(subfolders[i]);
            }
            //console.log('subfolders after encode', subfolders);
            var subs = subfolders.join('/');
            // encode does not catch parenthesis - fix
            subs = subs.split('(').join('%28').split(')').join('%29');
            // console.log('subfolders as string', subs);
            // reassemble
            var newUrl = (query !== '') ? host + '/' + subs + '?' + query : host + '/' + subs;
            console.log('clean URL', newUrl);
            return newUrl;
        } else {
            return '';
        }
    }

    function isCanvasSupported() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

    function insertBlob(input, data) {
        var el = input.closest('.form-element');
        var blob = el.find('.blob');
        var textinput = el.find('input[type="text"]');
        blob.attr({
                'id': 'undo',
                'src': data
            });

        // first extract the file type
        // example: "data:image/png;base64,iVBORw0KGgoAAAAN..."
        //     contentType: using substring, grab value between "data:image/" and ";"
        //     so in my example, contentType = "png"
        //     then lead it with a '.'
        var contentType = '.' + data.substring(11, data.indexOf(';'));
        console.log('contentType', contentType);

        $("<img/>", {
                src: data,
                load: function() {
                    // el is an <img> and is constrained by css, these 
                    // values represent the container height and width
                    var containerW = blob.width();
                    var containerH = blob.height();

                    if (isCanvasSupported()) {
                        // this will be the editor ~ also hides the data: from prying eyes
                        var canvas = document.createElement('CANVAS');
                        canvas.classList.add('blob');
                        canvas.classList.add('preview');
                        canvas.setAttribute('id', 'canvas');
                        var ctx = canvas.getContext('2d');
                        canvas.width = containerW;
                        canvas.height = containerH;
                        ctx.drawImage(this, 0, 0, this.naturalWidth, this.naturalHeight,
                            0, 0, canvas.width, canvas.height);

                        var li = blob.parent();
                        // hide <img>
                        blob.css({
                                'display': 'none'
                            }).removeClass('blob');
                        // hello <canvas>
                        li.append(canvas);
                        var toolbar = el.find('.tools').attr('id', 'tools').addClass('actions');
                        // make the buttons
                        var rotateL = $('<button>')
                            .attr({
                                'type': 'button',
                                'title': 'Rotate 90° counter clockwise'
                            })
                            .html('<i data-icon="rotate_90_degrees_ccw"></i>')
                            .on('click', function(e) {
                                e.preventDefault();
                                rotateLeft(canvas, ctx);
                                el.find('.dimension').css({
                                        'max-width': $('#canvas').height()
                                    });
                                $(this).trigger('blur');
                            });
                            
                        var rotateR = $('<button>')
                            .attr({
                                'type': 'button',
                                'title': 'Rotate 90° clockwise'
                            })
                            .addClass('mirror-hor')
                            .html('<i data-icon="rotate_90_degrees_ccw"></i>')
                            .on('click', function(e) {
                                e.preventDefault();
                                rotateRight(canvas, ctx);
                                el.find('.dimension').css({
                                        'max-width': $('#canvas').height()
                                    });
                                $(this).trigger('blur');
                            });
                        
                        var resize = $('<button>')
                            .attr({
                                'type': 'button',
                                'title': 'Resize'
                            })
                            .addClass('mirror-vert')
                            .html('<i data-icon="photo_size_select_small"></i>')
                            .on('click', function(e) {
                                e.preventDefault();
                                //create resizable over canvas 
                                resizeCanvas(canvas, ctx);
                            });
                        var crop = $('<button>')
                            .attr({
                                'type': 'button',
                                'title': 'Crop'
                            })
                            .html('<i data-icon="crop"></i>')
                            .on('click', function(e) {
                                e.preventDefault();
                                //create 
                                cropCanvas(canvas, ctx);
                            });
                        // add the buttons, but only the ones that will work with the platform
                        if(!mobile){
                            toolbar.append(rotateL).append(rotateR).append(resize).append(crop);
                        }else{
                            toolbar.append(rotateL).append(rotateR);
                        }
                    }

                    // update overlay text on image this equals the new_img natural height and width
                    var dimension = '';
                    if (containerW === this.width && containerH == this.height) {
                        dimension = 'Original: ' + this.width + 'x' + this.height + ' pixels';
                    } else {
                        dimension = 'Original: ' + this.width + 'x' + this.height + ' pixels, Resized: ' + containerW + 'x' + containerH + ' pixels';
                        createSnackbar('<i data-icon="photo_size_select_large"></i>Image automatically resized to fit edit area.', 'Dismiss');
                    }
                    el.find('.dimension')
                        .css({
                            'max-width': containerW + 'px'
                        })
                        .find('small')
                        .text(dimension);

                    window.setTimeout(function() {
                        contentType = (contentType === '.jpeg') ? '.jpg' : contentType;
                        el.find('span.ext').text(contentType);
                        var val = textinput.val();
                        if (val === '') {
                            textinput.val('name this image').attr('placeholder', ' ');
                            textinput.trigger('input');
                        } else {
                            textinput.attr('placeholder', ' ');
                            textinput.trigger('input');
                        }
                        textinput.trigger('select');
                    }, 50);
                }
            });
    }
    

    // image editor
    function cropCanvas(canvas, ctx) {
        // prevent more from opening
        $('#resizer, #overlay').remove();
        var el = $(canvas).closest('.form-element');
        el.find('.confirm').remove();

        var init_coords = getOffset(canvas);
        var bg_img = 'url("' + canvas.toDataURL() + '")';
        var resizer = $("<div>", {
                id: "resizer"
            })
            .css({
                'position': 'absolute',
                'left': init_coords.left,
                'top': init_coords.top,
                'width': canvas.width,
                'height': canvas.height,
                'background': 'rgba(33, 150, 243, 0.15)',
                'z-index': '2'
            })
            .html('<div class="dimension"><small class="form-element-hint resizing"></small></div>')
            .appendTo('body');

        // cancel button
        el.find('.cancel').remove();
        var cancel = $('<button>')
            .attr({
                'type': 'button',
                'title': 'Cancel edit'
            })
            .addClass('cancel round')
            .html('<i data-icon="highlight_off"></i>')
            .on('click', function() {
                resizer.remove();
                el.find('.confirm').remove();
                $(this).remove();
            });
        el.find('.tools').append(cancel);

        // start values in case there is a drag or resize with no change
        var resizeWidth = canvas.width,
            resizeHeight = canvas.height,
            resizeLeft = 0,
            resizeTop = 0;

        resizer.draggable({
                containment: $(canvas),
                drag: function(e, ui) {
                    var coords = getOffset(canvas);
                    resizeWidth = Math.round($(this).width());
                    resizeHeight = Math.round($(this).height());
                    resizeLeft = Math.round(coords.left - ui.position.left);
                    resizeTop = Math.round(coords.top - ui.position.top);
                    var string = resizeWidth + 'x' + resizeHeight + 'pixels';
                    $(".dimension small.resizing").text(string);
                },
                stop: function(e, ui) {
                    var coords = getOffset(canvas);
                    resizeWidth = Math.round($(this).width());
                    resizeHeight = Math.round($(this).height());
                    resizeLeft = Math.round(coords.left - ui.position.left);
                    resizeTop = Math.round(coords.top - ui.position.top);
                    //var string = resizeWidth+'x'+resizeHeight+' pixels, left:'+resizeLeft+'px, top:'+resizeTop+'px';
                    var string = resizeWidth + 'x' + resizeHeight + 'pixels';
                    $(".dimension small.resizing").text(string);
                }
            });
        resizer.resizable({
                aspectRatio: false,
                containment: $(canvas),
                maxWidth: canvas.width,
                maxHeight: canvas.height,
                handles: "all",
                resize: function(e, ui) {
                    var coords = getOffset(canvas);
                    resizeWidth = Math.round(ui.size.width);
                    resizeHeight = Math.round(ui.size.height);
                    resizeLeft = Math.round(coords.left - ui.position.left);
                    resizeTop = Math.round(coords.top - ui.position.top);
                    //tooltip to show new size 
                    var string = resizeWidth + 'x' + resizeHeight + 'pixels';
                    $(".dimension small.resizing").text(string);
                },
                stop: function(e, ui) {
                    el.find('.confirm').remove();
                    var confirm = $('<button>')
                        .attr({
                            'type': 'button',
                            'title': 'Confirm edit'
                        })
                        .addClass('confirm round')
                        .html('<i data-icon="check_circle"></i>')
                        .on('click', function() {
                            //tidy up
                            $('#dimension').text($('.dimension small.resizing').text());
                            resizer.remove();

                            $("<img/>", {
                                    src: canvas.toDataURL(),
                                    load: function() {
                                        // remove old image 
                                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                                        // resize canvas 
                                        canvas.width = resizeWidth;
                                        canvas.height = resizeHeight;
                                        // redraw
                                        ctx.drawImage(this, resizeLeft * -1, resizeTop * -1, resizeWidth, resizeHeight,
                                            0, 0, resizeWidth, resizeHeight);

                                        el.find('.dimension').css({
                                                'max-width': resizeWidth + 'px'
                                            });
                                        //get rid of temp image
                                        this.remove();
                                        // make an undo button
                                        el.find('.undo').remove();
                                        var undo = $('<button>')
                                            .attr({
                                                'type': 'button',
                                                'title': 'Undo edits'
                                            })
                                            .addClass('undo')
                                            .html('<i data-icon="restore"></i>')
                                            .on('click', function() {
                                                $('<img>', {
                                                        src: $('#undo').attr('src'),
                                                        load: function() {
                                                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                                                            canvas.height = $('#undo').height();
                                                            canvas.width = $('#undo').width();
                                                            ctx.drawImage(this, 0, 0, this.naturalWidth, this.naturalHeight,
                                                                0, 0, canvas.width, canvas.height);
                                                            el.find('.dimension').css({
                                                                    'max-width': canvas.width + 'px'
                                                                });
                                                            var dimension = canvas.width + 'x' + canvas.height + ' pixels';
                                                            el.find('.dimension small').text(dimension);
                                                            this.remove();
                                                        }
                                                    });
                                                // remove undo button
                                                $(this).remove();
                                                // get rid of resize tools
                                                $('#resizer, #overlay').remove();
                                            });
                                        // add undo button to toolbar
                                        el.find('.tools').prepend(undo);
                                    }
                                });
                            // get rid of cancel,confirm buttons
                            el.find('.cancel').remove();
                            $(this).remove();
                        });
                    // add confirm button to toolbar
                    el.find('.tools').append(confirm);
                }
            });
    }

    function resizeCanvas(canvas, ctx) {
        // prevent more from opening
        $('#resizer, #overlay').remove();
        var el = $(canvas).closest('.form-element');
        el.find('.confirm').remove();

        var init_coords = getOffset(canvas);
        var bg_img = 'url("' + canvas.toDataURL() + '")';
        var resizer = $("<div>", {
                id: "resizer"
            })
            .css({
                'position': 'absolute',
                'left': init_coords.left,
                'top': init_coords.top,
                'width': canvas.width,
                'height': canvas.height,
                'background-image': bg_img,
                'cursor': 'default',
                'z-index': '3'
            })
            .html('<div class="dimension"><small class="form-element-hint resizing"></small></div>')
            .appendTo('body');

        var overlay = $('<div>', {
                id: "overlay"
            })
            .css({
                'position': 'absolute',
                'left': init_coords.left,
                'top': init_coords.top,
                'width': canvas.width,
                'height': canvas.height,
                'background-color': '#888',
                'background-image': 'linear-gradient(45deg, #ababab 25%, transparent 25%), linear-gradient(-45deg, #ababab 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ababab 75%), linear-gradient(-45deg, transparent 75%, #ababab 75%)',
                'background-size': '20px 20px',
                'background-position': '0 0, 0 10px, 10px -10px, -10px 0',
                'z-index': '2'
            })
            .appendTo('body');

        el.find('.cancel').remove();
        var cancel = $('<button>')
            .attr({
                'type': 'button',
                'title': 'Cancel edit'
            })
            .addClass('cancel round')
            .html('<i data-icon="highlight_off"></i>')
            .on('click', function() {
                resizer.remove();
                overlay.remove();
                el.find('.confirm').remove();
                $(this).remove();
            });
        // add cancel to toolbar
        el.find('.tools').append(cancel);

        // start values in case there is a resize with no change
        var resizeWidth = canvas.width,
            resizeHeight = canvas.height;

        resizer.resizable({
                aspectRatio: true,
                containment: $(canvas),
                maxWidth: canvas.width,
                maxHeight: canvas.height,
                resize: function(e, ui) {
                    resizeWidth = Math.round(ui.size.width);
                    resizeHeight = Math.round(ui.size.height);
                    //tooltip to show new size 
                    var string = resizeWidth + 'x' + resizeHeight + 'pixels';
                    $(".dimension small.resizing").text(string);
                },
                stop: function(e, ui) {
                    el.find('.confirm').remove();
                    var confirm = $('<button>')
                        .attr({
                            'type': 'button',
                            'title': 'Confirm edit'
                        })
                        .addClass('confirm round')
                        .html('<i data-icon="check_circle"></i>')
                        .on('click', function() {
                            //tidy up
                            $('#dimension').text($('.dimension small.resizing').text());
                            resizer.remove();
                            overlay.remove();

                            $("<img/>", {
                                    src: canvas.toDataURL(),
                                    load: function() {
                                        // remove old image 
                                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                                        // resize canvas 
                                        canvas.width = resizeWidth;
                                        canvas.height = resizeHeight;
                                        // redraw saved image 
                                        ctx.drawImage(this, 0, 0, resizeWidth, resizeHeight);
                                        $(canvas).closest('.form-element-list').find('.dimension').css({
                                                'max-width': resizeWidth + 'px'
                                            });
                                        // get rid of temp image
                                        this.remove();

                                        el.find('.undo').remove();
                                        var undo = $('<button>')
                                            .attr({
                                                'type': 'button',
                                                'title': 'Undo edits'
                                            })
                                            .addClass('undo')
                                            .html('<i data-icon="restore"></i>')
                                            .on('click', function() {
                                                $('<img>', {
                                                        src: $('#undo').attr('src'),
                                                        load: function() {
                                                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                                                            canvas.height = $('#undo').height();
                                                            canvas.width = $('#undo').width();
                                                            ctx.drawImage(this, 0, 0, this.naturalWidth, this.naturalHeight,
                                                                0, 0, canvas.width, canvas.height);
                                                            el.find('.dimension').css({
                                                                    'max-width': canvas.width + 'px'
                                                                });
                                                            var dimension = canvas.width + 'x' + canvas.height + ' pixels';
                                                            el.find('.dimension small').text(dimension);
                                                            this.remove();
                                                        }
                                                    });
                                                // remove undo button
                                                $(this).remove();
                                                // get rid of resize tools
                                                $('#resizer, #overlay').remove();
                                            });
                                        // prepend the undo button
                                        el.find('.tools').prepend(undo);
                                    }
                                });
                            // remove cancel, confirm buttons
                            el.find('.cancel').remove();
                            $(this).remove();
                        });
                    // add confirm to toolbar
                    el.find('.tools').append(confirm);
                }
            });
    }

    function rotateLeft(canvas, ctx) {
        var conf = {
            x: 0,
            y: canvas.height,
            r: -90 * Math.PI / 180,
            left: canvas.height - canvas.width,
            top: 0
        };
        rotate(conf, canvas, ctx);
    }

    function rotateRight(canvas, ctx) {
        var conf = {
            x: canvas.width,
            y: 0,
            r: 90 * Math.PI / 180,
            left: 0,
            top: canvas.width - canvas.height
        };
        rotate(conf, canvas, ctx);
    }

    function rotate(conf, canvas, context) {
        $('#resizer, #overlay').remove();
        $(canvas).closest('.form-element').find('.cancel').remove();
        $(canvas).closest('.form-element').find('.confirm').remove();
        $("<img/>", {
                src: canvas.toDataURL(),
                load: function() {
                    //clear canvas left, top, right, bottom
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    //swap sizes on the canvas element
                    var h = canvas.height;
                    canvas.height = canvas.width;
                    canvas.width = h;
                    // set rotation axis
                    context.translate(conf.x, conf.y);
                    // rotate the image
                    context.rotate(conf.r);
                    //redraw saved image swapping height for width
                    context.drawImage(this, conf.left, conf.top, canvas.height, canvas.width);
                    // update hint/dimension
                    var string = canvas.width + 'x' + canvas.height + 'pixels';
                    $(canvas).closest('.form-element').find('.dimension small').text(string);
                    // clear out the image from memory
                    $(this).remove();
                }
            });
    }

    function getOffset(el) {
        var offset = el.getBoundingClientRect();
        return {
            left: offset.left + window.scrollX,
            top: offset.top + window.scrollY
        }
    }
    

    // add list
    function requiredList(input) {
        if (input.data('required')) {
            if (hasListItems(input)) {
                input.removeAttr('data-required');
            } else {
                input.attr('data-required', 'true');
            }
        }
    }

    function setEntryArray(target) {
        var arr = '';
        var group = '';
        $('#' + target + ' .entry .text').each(function() {
            arr += $(this).text().trim() + '; ';
            if ($(this).data('group')) {
                group += $(this).data('group') + '; ';
            }
        });

        var dl = $('#' + target);
        // special for victims list
        if (target == 'victims') {
            updateHidden(dl.find('.entry').length, 'fatalities');
            setTotal();
        }
        // groups are part of weapons typeahead
        if (group !== '') {
            updateHidden(group, 'group');
        }
        updateHidden(arr, target);
    }

    function returnIfNewTypeahead(input, event) {
        var el = input.closest('.form-element');
        var isnew = el.hasClass('-isnew');
        var isempty = (input.val() === '') ? true : false;
        // user erases the whole string in input
        if (isempty) {
            el.removeClass('-isnew');
            var radios = el.find('.form-radio input');
            radios.each(function() {
                if ($(this).is(':checked')) {
                    $(this).prop('checked', false);
                }
            });
        }
        if (isnew) {
            console.log('isnew');
            event.preventDefault();
            var radios = el.find('.form-radio input');
            radios.each(function() {
                if ($(this).is(':checked')) {
                    el.removeClass('-isnew');
                    el.find('.add').trigger('click');
                }
            });

            // new, not checked - loop back
            input.trigger('focus');
            return true;
        }
        // not new or empty, keep going
        return false;
    }

    function returnIfNoValid($input, $button, event) {
        var el = $button.closest('.form-element');
        // if validation is present on form-element
        // if $input has some value
        // NOTE: runs on lists that ONLY have the 'valid' indicator button in them (currently url)
        if (!el.hasClass('-isvalid') && $input.val() !== '' && $button.prev().hasClass('valid')) {
            event.preventDefault();
            el.addClass('-novalidate');
            $input.trigger('focus');
            if($input.hasClass('url')){
                createSnackbar('<i data-icon="report_problem"></i>Whoops! That is not a link', 'Dismiss');
            }
            return false;
        } else {
            el.removeClass('-isvalid').removeClass('-novalidate');
            $input.removeClass('-hasvalue');
            return true;
        }
    }

    function hasListItems(input) {
        return (!$(input.data('target')).find('.entry').length) ? false : true;
    }
    
    function hasValue(node, cl){
        var wrap = node.closest(cl);
        node.on('focus', function() {
            wrap.addClass('-hasvalue');
        })
        .on('blur', function() {
            if ($(this).val() === '') {
                wrap.removeClass('-hasvalue');
            }
        });
    }
    

    // validate(file and url entries)
    function validURL(userInput) {
        var regexQuery = "^(http(s)?:\/\/.)(www\\.)?([-a-z0-9]{1,63}\\.)*?[a-z0-9][-a-z0-9]{0,61}[a-z0-9]\\.[a-z]{2,6}([-a-zA-Z0-9@:%_\+.~#?&//=]*)?$";
        var url = new RegExp(regexQuery, "i");
        return url.test(userInput);
    }
    

    // number
    function number($button, operator) {
        var input = $button.closest('.form-element').find("input");
        var oldValue = input.val();
        // change attr type from string to number
        var min = input.attr('min') * 1;
        var old = (oldValue) ? oldValue * 1 : min;

        var newVal = 0;
        if (operator == "+") {
            // addition
            newVal = old + 1;
        } else {
            // subtractions
            // Don't allow decrementing below zero
            newVal = (old > (min + 1)) ? old - 1 : min;
        }
        input.val(newVal);
        input.trigger('change');
    }
    

    // injured + fatalities
    function setTotal() {
        var inj = ($('[name="injured"]').val() !== '') ? $('[name="injured"]').val() : '0';
        var fat = $('[name="fatalities"]').val();// number field defaults to zero
        updateHidden(parseInt(fat) + parseInt(inj), 'total');
    }
    
    
    // toggle secondary suspect
    function secondaryOff(){
        $('div.secondary').css('display', 'none');
        $('div.primary').removeClass('m6').addClass('m12');
        $('.secondary .form-has-error').removeClass('form-has-error');
        $('span.secondary').css('display', 'none');
        // restore the default settings
        $('.primary:radio, .secondary:radio, .secondary :radio')
            .each(function(){
                $(this).prop('checked',false);
            });
        $('.primary:radio').parent().removeClass('hide');
        
        $('.secondary:radio').parent().addClass('hide');
        $('.secondary input:not(:radio)').val('');
        $('.secondary .-hasvalue').removeClass('-hasvalue');        
    }
    function secondaryOn(){
        // .secondary used on select option fields
        // pluralizes the label
        // and the container holding the input fields
        $('div.secondary').css('display', 'block');
        $('span.secondary').css('display', 'inline');
        $('div.primary').removeClass('m12').addClass('m6');

        $('.primary:radio, .secondary:radio, .secondary :radio')
            .each(function(){
                $(this).prop('checked',false);
            });
        // default select option fields for perpetrator
        $('.primary:radio').parent().addClass('hide');
        // all secondary options
        $('.secondary:radio').parent().removeClass('hide');
    }
    

    // hidden inputs, you can choose a form if the form element is outside the form
    function updateHidden(val, target, formid) {
        var form = (!formid) ? getForm() : getForm(formid);
        
        if ($('[name="' + target + '"]') !== undefined) {
            $('[name="' + target + '"]').remove();
        }
        $('<input>').attr({'type': 'hidden','name': target}).val(val).appendTo(form);
    }
    
    // submit
    function precheckForm() {
        // check for errors on <input> and <select>
        console.log('--running precheck--');
        
        $('.form-radio')
            .each(function() {
                var input = $(this).find('input:checked');
                if (input.length == 0) {
                    var is_req = $(this).find('input[data-required]').length;
                    if (is_req > 0) {
                        $(this).addClass('form-has-error');
                        $('.secondary:hidden .form-has-error').removeClass('form-has-error');
                        if($(this).hasClass('form-has-error')){
                            console.log('choice required on:', $(this).find('input:first').attr('name'));
                        }
                    }
                }
            });
            
        $('.form-element-field')
            .each(function() {
                var input = $(this), el = input.closest('.form-element');

                if (input.data('required')) {
                    // not the lists, which always have empty inputs and entries in dl
                    //console.log('%s value = `%s`', input.attr('id'), input.val());

                    if (!input.hasClass('-hasvalue') && !input.attr('data-target')) {
                        el.addClass('form-has-error');
                        $('.secondary:hidden .form-has-error').removeClass('form-has-error');
                        if(el.hasClass('form-has-error')){
                            console.log('required value on:', input.attr('name'));
                        }
                    }
                    if (input.attr('data-target') && input.data('required')) {
                        if ($(input.data('target')).find('.entry').length == 0 && $(input.data('target')).find('.chip').length == 0) {
                            el.addClass('form-has-error');
                            console.log('list value required on:', input.attr('data-target'));
                        }
                    }
                }
            })
            .on('change input keyup', function() {
                $(this).closest('.form-element').removeClass('form-has-error');
            });
        //if any errors, return false;
        if ($('.form-has-error').length > 0) {
            return false;
        } else {
            return true;
        }
    }

    // .active element underlines the field
    function setActive(which){
        if(which.closest('.form-element, .form-radio, .form-map-legend, .form-checkbox, .form-switch').hasClass('active')){
            return;
        }else{
            unsetActive();
        }
        which.closest('.form-element, .form-radio, .form-map-legend, .form-checkbox, .form-switch').addClass('active');
        // typeahead has a hidden radio selector for new entries, no <legend> text that highlights, so keep the parent .form-element highlighted
        which.closest('.form-element > .form-radio').parent().addClass('active');
    }
    function unsetActive(){
        $('.form-element, .form-radio, .form-map-legend, .form-checkbox, .form-switch').removeClass('active');
    }    

    // show/hide the spinner
    function toggleSpinner(){
        $('.paper-spinner').toggleClass('active');
        $('.spinner-container').toggleClass('active');
    }
    

    // reset the page
    function doReset(){
        // need a confirm dialog
        window.setTimeout(function() {
            

            $('[type="text"], [type="search"], [type="hidden"], [type="number"], [type="date"], [type="file"]').val('');

            // reset 0 values
            $('input[name="total"], input[name="fatalities"]').val('0');
            
            $('.entry, .chip').remove();
            
            // reset checkboxes and radio buttons to default
            $('input[type="checkbox"], input[type="radio"]')
                .each(function() {
                    // uncheck all
                    $(this).prop('checked', false);
                    // if default checked == true
                    if ($(this).attr("checked")) {
                        $(this).prop('checked', true);
                        $(this).trigger('change');
                    }
                });
            // secondary column wont reset by clicking switch
            // go back to default manually
            secondaryOff();

            // remove error styling && reset html indicators

            // remove the image and helper text
            clearImage($('input[type="file"]'));

            // remove any indication values have been added
            $('.-hasvalue, .-isnew, .-isvalid, .-novalidate, .form-has-error').removeClass('-hasvalue -isnew -isvalid -novalidate form-has-error');


            // hide map infowindow by using close x click trigger
            resetLocation();
            
            //reset map to starting values
            if (map !== undefined) {
                var point = new google.maps.LatLng(40.99103957222095, -98.06201537499999);
                map.setCenter(point);
                map.setZoom(4);
            }
            // map location hint reset
            $('#location-hint').text('');

            // reset uuid
            var new_uuid = guid();
            updateHidden(new_uuid, 'uid');
            JsBarcode("#code128").code128(new_uuid, {
                    format: "CODE128C",
                    ean128: true,
                    height: 40
                }).render();

            // focus on the top element
            $('form input:first').trigger('focus');

        }, 50);
    } 


    // utility to insert html elements before a target if it exists
    function appendOrBefore(el, content, target){
        if( target !== undefined ){
            // found a dl
            content.insertBefore(target)
        }else{
            el.append(content);
        }
    }
    
    var formElementMachine = (function() {
        return function(which) {
            if (which.length === -1) {
                // do the elements exist?
                console.warn('no matching elements found');
                return;
            }
            // create the html, ids, for all input fields
            which.each(function(){
                var el = $(this);
                var bar = $('<div class="form-element-bar">');
                var hint = $('<small class="form-element-hint">'+ el.data('hint') +'</small>');
                // all <inputs> selects are -hasvalue by default so if normal, they just work if we are not using formElementMachine()
                var input = el.find('.form-element-field:first');
                input.removeClass('-hasvalue');
                    
                var id = (input.attr('id') !== undefined) ? input.attr('id') : input.attr('name');
                // add the id to the input
                if (input.attr('id') === undefined) { input.attr('id', id) }
                
                // need to remove the old label before adding a new label
                var orig_label = el.contents('label:first');
                if( el.data('label') === undefined ){
                    el.data('label',orig_label.text());
                }
                orig_label.remove();
        
                // get the data-label or data-legend value
                var label = $('<label class="form-element-label" for="'+id+'">'+ el.data('label') +'</label>');
                // map needs a special label, using legend
                var legend = $('<legend class="form-map-legend">'+ el.data('legend') +'</legend>');
                
                // <dl>'s 
                var targetid = el.find('input[data-target]').data('target');
                
                var tabindex = input.attr('tabindex');
                
                // is there a pre-existing button actions area?
                var hasActions = (el.find('.form-element-action').length > 0) ? true : false;
        
                var buttons = el.data('buttons');
                // refer to or make form element action area
                var actions = (hasActions) ? el.find('.form-element-action:first') : $('<span>').addClass('form-element-action');
        
                // all <buttons>
                if(buttons !== undefined){
                    var buttons_arr = buttons.split(',');
                    for(i = 0; i< buttons_arr.length; i++){
                        var button;
                        // span (indicator) or button (action)
                        if(buttons_arr[i].indexOf('valid') > -1 || buttons_arr[i].indexOf('new') > -1 || buttons_arr[i].indexOf('search') > -1){
                            button = $('<span>')
                                .addClass(buttons_arr[i])
                                .on('click', function() {
                                    el.find('input:first').trigger('focus');
                                });
                            if(button.hasClass('new')){
                                button.html('<i data-icon="new_releases"></i>');
                            }
                            if(button.hasClass('valid')){
                                button.html('<i data-icon="check_circle_outline"></i>');
                            }
                            if(button.hasClass('search')){
                                button.html('<i data-icon="search"></i>');
                            }
        
                        }else{
                            button = $('<button>').attr('type','button').addClass(buttons_arr[i]);
                        }
                        // get the tab value from the input
                        if(tabindex === undefined){
                            button.attr('tabindex', '-1');
                        }
        
                        if(button.hasClass('plus')){
                            button.attr({'title':'Increase','aria-label':'Increase'}).html('<i data-icon="add_circle_outline"></i>');
                        }
                        if(button.hasClass('minus')){
                            button.attr({'title':'Decrease','aria-label':'Decrease'}).html('<i data-icon="remove_circle_outline"></i>');
                        }
                        // ug breaks the rule?
                        if(button.hasClass('dictate')){
                            button.attr({'title':'Dictate','aria-label':'Dictate'}).html('<i data-icon="mic"></i>');
                        }
                        if(button.hasClass('add')){
                            button.attr({'title':'Add to list','aria-label':'Add to list'}).html('<i data-icon="playlist_add"></i>');
                        }
                        if(button.hasClass('openfile')){
                            button.attr({'title':'Open image files...','aria-label':'Open image files...'}).html('<i data-icon="image"></i>');
                        }
                        if(button.hasClass('paste')){
                            button.attr({'title':'Paste image','aria-label':'Paste image'}).html('<i data-icon="content_paste"></i>');
                        }
        
                        // map again
                        if(button.hasClass('search')){
                            $('.search-searchbox-button').append(button)
                        }else{
                            actions.append(button);
                        }
                    }
                    // buttons go right under first input element, even when wrapped
                    if(!hasActions){
                        input.parent().append(actions);
                    }
                }
                
                var len = el.find('.form-element-action:first').children().length;
                //console.log('input id=%s - buttons %s', input.attr('id'), len);
                // form-file has its input being a rename field that auto changes size.
                // #search-searchbox-input is map field
                if(!el.is('.form-file')){
                    input.addClass('button-room'+len);
                }
                
                // selects insert the dl after running selectChange
                // list dls are created here
                if(targetid !== undefined){
                    // <dl>
                    if($(targetid).length == 0){
                        var listid = targetid.replace('#','');
                        var list = $('<dl>').attr('id', listid).addClass('form-element-list');
                        el.append(list);
                    }
                    
                    if(targetid == '#'+id){
                        console.error('<input name="%s" data-target="%s">, data-target must be unique id!! ', id, targetid);
                    }
                    if(targetid.indexOf('#') == -1){
                        console.error('data-target `%s` must be prefixed with `#` ', targetid);
                    }
                }
                
                // special function that checks if a dl was made - if true, insert the bar and items before it
                appendOrBefore(el, bar, targetid)
                
                if(el.data('label')){
                    appendOrBefore(el, label, targetid);
                }
                if(el.data('legend')){
                    appendOrBefore(el, legend, targetid);
                }
                if(el.data('hint')){
                    appendOrBefore(el, hint, targetid);
                    
                    // map has a second hint area showing the address of the clicked point and a delete button
                    if(el.hasClass('form-map')){
                        hint.css('float','left');
                        appendOrBefore(el, $('<small class="form-element-hint" id="location-hint" style="float:right"></small>'), targetid);
                    }
                }
            });
        };
        
    })();
    
    formElementMachine($('.form-element'));

    // field listeners for active element
    // each loop will add the required listeners, actions to desired button, input, select, textarea
    $(':input')
        .each(function(i) {
            // required transformation, add star
            if ($(this).is('[required]')) {
                $(this).removeAttr('required').attr({'data-required': true, 'aria-required': true});
                var el = $(this).closest('.form-element, .form-radio, .form-checkbox');
                var star = $('<span>').attr('aria-hidden', true).addClass('required').text('*');
                var label = el.find('.form-element-label, .form-map-legend, .form-radio-legend, .form-checkbox-legend');
                if (label.find('span.required').text() === '') {
                    label.attr({
                        'aria-label': 'This field is required' 
                    }).append(star);
                }
            }
            // inputs can be subtley corrected for pc keyboard input
            if($(this).is('[autocapitalize]')){
                $(this)
                .on('input', function(){
                    $(this).val(autoCapitalize($(this).val(),$(this).attr('autocapitalize')));
                });
            }
            // list & my multiple select input
            if($(this).data('target')){
                $(this)
                .on('keypress', function(e) {
                    // allow enter or plus + to submit
                    //console.log('key pressed %s',e.which);
                    if (e.keyCode === 13 || e.keyCode === 43) {
                        e.preventDefault();
                        var add = $(this).closest('.form-element').find('.add');
                        if (add !== undefined) {
                            add.trigger('click');
                        }
                    }
                    if (e.key === ";") { // disallow semicolon on list 
                        return false;
                    }
                });
            }
            // date
            if($(this).is('[type="date"]')){
                var todaynow = today();
                $(this)        
                .on('change', function() {
                    var d = $(this).val();
                    var yr = new Date(d).getFullYear();
                    updateHidden(yr, 'year');
                })
                .on('focus', function() {
                    if ($(this).hasClass('-hasvalue')) {
                        return false;
                    }
                    if(!$(this).is('[max]')){
                       $(this).attr('max', todaynow);
                    }
                    $(this).val(todaynow).trigger('change');
                })
                .on('blur', function() {
                    var d = new Date(); //today
                    var userdate = new Date($(this).val()); //user set
                    // compare if set is more than today
                    if (userdate > d) {
                        // reset date to today
                        $(this).val(todaynow).trigger('change');
                    }
                });
            }
            // specific button actions and listeners
            if($(this).is('button')){
                if($(this).hasClass('plus')){
                    $(this)
                    .on('click', function(e) {
                        e.preventDefault();
                        number($(this), '+');
                    });
                }
                if($(this).hasClass('minus')){
                    $(this)
                    .on('click', function(e) {
                        e.preventDefault();
                        number($(this), '-');
                    });
                }
                if($(this).hasClass('minus')||$(this).hasClass('plus')){
                    $(this)
                    .on('focus', function(e) {
                        e.preventDefault();
                        $(this).closest('.form-element').find('[type="number"]').focus();
                    });
                }
                if($(this).hasClass('add')){
                    $(this)
                    .on('click', function(e) {
                        var el = $(this).closest('.form-element');
                        // find the input field from the .add button
                        var input = el.find('input:first');
            
                        // url validation
                        if (!returnIfNoValid(input, $(this), e)) return false;
            
                        // typeahead check
                        if (returnIfNewTypeahead(input, e)) return true;
            
                        var targetid = input.data('target');
                        var list = el.find(targetid);
                        var listid = list.attr('id');
                        var radios = $('.' + listid + '_group');
            
                        // get its value
                        var value = input.val();
                        if (value === '') {
                            input.focus();
                            return;
                        }
    
                        // new or existing typeahead, get its checked value
                        var group;
                        radios.each(function() {
                            if ($(this).is(':checked')) {
                                group = $(this).val();
                            }
                        });
                        // put the <input> value into a <span> element, make a remove and edit <button> element for the <dt> .entry element
                        var span = $('<span>').attr({
                                'data-group': group,
                                'title': value,
                                'aria-label': value
                            }).addClass('text').text(value);
                        var editbtn = $('<button type="button" class="edit" title="Edit" aria-label="Edit"><i data-icon="edit"></i></button>');
                        var removebtn = $('<button type="button" class="remove" title="Delete" aria-label="Delete"><i data-icon="delete"></i></button>');
                        // remove, edit <button>
                        var actions = $('<span>').addClass('actions').append(editbtn).append(removebtn);
                        var inline = $('<span>').addClass('form-input-flex').append(span).append(actions)
                        
                        // make new <dt> .entry element append the <span>
                        var entry = $('<dt>').addClass('entry').append(inline);
            
                        // add the click behavior to the remove <button>
                        $(removebtn).on('click', function(e) {
                            var dt = $(this).closest('dt');
                            dt.remove();
                            // change keeps track of required on list .entry rows
                            input.trigger('focus');
                            setEntryArray(listid);
                        }).on('focus', function(){
                            setActive($(this));
                        });
            
                        // add the click behavior to the edit <button>
                        $(editbtn).on('click', function(e) {
                            var dt = $(this).closest('dt');
                            var txt = dt.find('span.text');
                            var val = txt.text();
                            var group = txt.data('group');
                            el.addClass('-isvalid');
                            var input = el.find('input:first');
                            input.val(val).select();
                            // recheck typeahead groups
                            radios.each(function(i) {
                                if (group === $(this).val()) {
                                    setRadios(input, group);
                                }
                            });
                            dt.remove();
                            input.trigger('focus');
                            setEntryArray(listid);
                        }).on('focus', function(){
                            setActive($(this));
                        });
            
                        // append <dt> to <dl> after behavior added
                        list.append(entry);
            
                        // update the value in the hidden field
                        setEntryArray(listid);
            
                        // uncheck the group radio button
                        radios.each(function(i) {
                            $(this).prop('checked', false);
                        });
            
                        // ready for the next add
                        input.val('').focus();
                        
                        // reset in case new radio was checked in typeahead
                        $('.new').attr('style','');
                    });
                }
                if($(this).hasClass('openfile')){
                    $(this)
                    .on('click', function() {
                        var el = $(this).closest('.form-element');
                        var input = el.find('input[type="text"]');
                        var file = el.find('input[type="file"]');
                        if (input.val() !== '') {
                            clearImage(file);
                        }
                        file.trigger('click');
                    });
                }
                if($(this).hasClass('paste')){
                    $(this)
                    .on('click', function() {
                        var el = $(this).closest('.form-element');
                        var input = el.find('input[type="text"]');
                        var file = el.find('input[type="file"]');
                        if (input.val() !== '') {
                            clearImage(file);
                        }
                        file.attr('disabled', true).addClass('-hasvalue').addClass('form-element-field');
                        input.css('width', '100%');
                        input.trigger('focus');
                        input.off('click');
                    });
                }
                if($(this).hasClass('reset')){
                    $(this)
                    .on('click',function(e){
                        e.preventDefault();
                        doReset();
                        createSnackbar('<i data-icon="restore_page"></i>Form reset!', 'Dismiss');
                    });
                }
                /*dictate*/
                if($(this).hasClass('dictate')){
                    $(this)
                    .on('click', function(e){
                        toggleModal(e);                
                    });
                    // find the dictation selects and add updateCountry
                    
                }
                /* map */
                if($(this).hasClass('zoomin')){
                    $(this).attr({'title':'Zoom in','aria-label':'Zoom in'}).html('<i data-icon="add_circle_outline"></i>');
                }
                if($(this).hasClass('zoomout')){
                    $(this).attr({'title':'Zoom out','aria-label':'Zoom out'}).html('<i data-icon="remove_circle_outline"></i>');
                }
                if($(this).hasClass('point')){
                    $(this).attr({'title':'Set this point','aria-label':'Set this point'}).html('<i data-icon="gps_not_fixed"></i>');
                }
            }
            // initial hasvalues/ typeahead
            if($(this).is('[type="radio"],[type="checkbox"]')){
                if($(this).is(':checked')){
                    $(this).addClass('-hasvalue');
                }else{
                    $(this).removeClass('-hasvalue');
                }
                // typeahead new entry needs its group, remove the new indicator once user selects
                $(this)
                .on('click', function() {
                    var el = $(this).closest('.form-element');
                    el.find('.form-element-action .new').css('display','none');
                });
            }
        })
        .on('change input', function() {
            // .-hasvalue simply performs the open animation on input fields
            if ($(this).is(':checked') || $(this).val() !== '') {
                $(this).addClass('-hasvalue').closest('.form-element, .form-radio').removeClass('form-has-error');
            }else{
                // text input is empty
                $(this).removeClass('-hasvalue');
            }
            // toggle for checkbox
            if($(this).is('[type="checkbox"]') && !$(this).is(':checked')) {
                $(this).removeClass('-hasvalue');
            }
            // toggle for radio
            if($(this).is('[type="radio"]')) {
                var radios = $(this).closest('.form-element fieldset, fieldset.form-radio').find('[type="radio"]');
                // clear the group
                radios.each(function() {
                    $(this).removeClass('-hasvalue');
                });
                // add the active
                $(this).addClass('-hasvalue');
            }
            // checkbox/switch, so we can save the value if necessary without checking .prop()
            if($(this).is('.-istruefalse')){
                if ($(this).is(':checked')) {
                    $(this).attr({'value': 'true', 'aria-checked': 'true', 'data-checked': 'true'}).data('checked', true);
                } else {
                    $(this).attr({'value': 'false', 'aria-checked': 'false', 'data-checked': 'false'}).data('checked', false);
                }
            }
        })
        .on('focus', function(){
            if($(this).is('[readonly]')){
                $(this).addClass('-hasvalue')
            }
            setActive($(this));
        });
        
    // injured is special
    $('[name="injured"]').on('change', function() {
        setTotal();
    });
    
    // initial dictation listeners after first select transformation 
    // needs to be here after select_component.js
    $('input[name=select_language]').on('change', function(){
        updateCountry();
    });
    // dictation
    $('input[name=select_language], input[name=select_dialect]').on('focus', function(){
        cancelOnClick();
    });


    // switch
    $('#secondary')
        .on('click', function() {
            if ($(this).is(':checked')) {
                secondaryOn();
            } else {
                secondaryOff();
            }
            // reset specific code for select example
            $('#gender_input').val('').removeClass('-hasvalue');
            
            var section = $(this).closest('.form-section');
            section.find('.modal').find('input:radio')
                .each(function() {
                    // uncheck all
                    $(this).prop('checked', false);
                    // if default checked == true
                    if (Boolean($(this).data("checked"))) {
                        $(this).trigger('click');
                    }
                });
        });
    
    // file inputs
    $('.form-file input[type="file"]')
        .on('change', function() {
            if (this.files && this.files[0]) {
                var el = $(this).closest('.form-element');
                el.find('input[type="text"]:first').off('input').off('click');
                // push the object into the readFILE function
                makeImage($(this));
                readFILE(this, el);
            } else {
                clearImage($(this));
            }
        });
    $('.form-file input[type="text"]')
        .on('click', function() {
            var el = $(this).closest('.form-element');
            el.find('input[type="file"]').addClass('-hasvalue').addClass('form-element-field').removeAttr('disabled');
            // open the file picker on click
            if ($(this).val() !== '') return;
            el.find('.openfile').trigger('click');
        })
        .on('keypress', function(e) {
            var ext = $(this).closest('.form-element').find('.ext').text();
            //console.log(ext);
            if ($(this).val() === '' && ext === '') {
                e.preventDefault();
                return false;
            }
        })
        .on('input', function() {
            $(this).off('input');
            var url = $(this).val();
            if (url !== '') {
                makeImage($(this));
                readURL($(this), url);
            } else {
                clearImage($(this));
            }
        })
        .bind('paste', function() {
            $(this).trigger('focus');
        })
        .on('blur', function() {
            if ($(this).val() === '') {
                var el = $(this).closest('.form-element');
                el.find('input[type="file"]').removeClass('-hasvalue').removeClass('form-element-field').removeAttr('disabled');
            }
        })
        .on('focus', function() {
            var el = $(this).closest('.form-element');
            el.find('input[type="file"]').addClass('-hasvalue').addClass('form-element-field').attr('disabled', true);
        });
    $('.form-input-flex')
        .on('click', function() {
            $(this).find('input').focus();
        });
        
    // validate type list
    $('input.url')
        .on('input', function(e) {
            var val = $(this).val();
            var el = $(this).closest('.form-element');
            if (val === '') {
                el.removeClass('-isvalid').removeClass('-novalidate');
            } else {
                window.setTimeout(function() {
                    el.removeClass('-novalidate');
                }, 2500);
            }
            if (e.keyCode == 8 || e.which == 8) {
                el.removeClass('-isvalid');
            }

            if (!validURL(val)) {
                el.removeClass('-isvalid');
            } else {
                el.addClass('-isvalid');
            }
        });

    /* typeahead */
    // the .pac-icon class('magnifying glass') that appears in front of the search result is borrowed from google .map typeahead
    try{
    $('input.form-typeahead')
        .typeahead({
            order: "asc",
            minLength: 1,
            maxItem: false,
            cancelButton: false,
            template: '<span class="pac-icon pac-icon-search"></span>{{display}} <small style="color:#888;font-size:x-small;">{{group}}</small>',
            source: {
                'accessory': {
                    data: ["Bipod",
                        "Body armor",
                        "Bump fire stocks",
                        "Pistol grip",
                        "Telescopic sight",
                        "Tripod",
                        "Vertical forward grips"
                    ]
                },
                'ammo': {
                    data: ["1000 rounds",
                        "2000 rounds",
                        "2500 rounds",
                        "Hundreds of rounds",
                        "Unknown rounds"
                    ]
                },
                'derringer': {
                    data: [".22 Magnum derringer",
                        ".38 Davis Industries two-shot derringer",
                        ".22 Double Deuce Buddie two-shot derringer",
                        "Unknown derringer"
                    ]
                },
                'explosive': {
                    data: ["Pipe bomb",
                        "Dynamite",
                        "Chemical bomb",
                        "Ch Ch Ch Cherry bomb",
                        "Homemade explosive",
                        "Plastic explosive",
                        "IED (Improvised Explosive Device)",
                        "Unknown explosive/bomb"
                    ]
                },
                'handgun': {
                    data: [".22 handgun",
                        ".22 Ruger semi-automatic handgun",
                        ".22 Walther P22 semi-automatic handgun",
                        ".25 Raven Arms MP-25 semi-automatic handgun",
                        ".25 semi-automatic handgun",
                        ".32 Retolaza semi-automatic handgun",
                        ".38 handgun",
                        ".380 ACP Browning Ruger M-77",
                        ".380 handgun",
                        ".380 Ruger AR-556",
                        ".380 Star semi-automatic handgun",
                        ".40 Beretta semi-automatic handgun",
                        ".40 Glock 23",
                        ".40 Glock Model 22 handgun",
                        ".40 Glock semi-automatic handgun",
                        ".40 handgun",
                        ".40 Ruger",
                        ".40 semi-automatic handgun",
                        ".40 Smith & Wesson handgun",
                        ".40 Smith & Wesson semi-automatic handgun",
                        ".45 Colt 1911-A1 semi-automatic handgun",
                        ".45 Colt semi-automatic handgun",
                        ".45 Glock model 41 handgun",
                        ".45 handgun",
                        ".45 Heckler & Koch handgun",
                        ".45 Hi-Point semi-automatic handgun",
                        ".45 Ruger P90 semi-automatic handgun",
                        ".45 semi-automatic handgun",
                        ".45 Smith & Wesson handgun",
                        ".45 Springfield semi-automatic handgun",
                        "10mm Glock handgun",
                        "9mm Beretta handgun",
                        "9mm Beretta 92FS semi-automatic handgun",
                        "9mm Beretta semi-automatic handgun",
                        "9mm Browning P35 Hi-Power semi-automatic handgun",
                        "9mm Glock handgun",
                        "9mm Glock 17 handgun",
                        "9mm Glock 17 semi-automatic handgun",
                        "9mm Glock 19 semi-automatic handgun",
                        "9mm Glock handgun",
                        "9mm Glock semi-automatic handgun",
                        "9mm handgun",
                        "9mm Intratec DC-9 semi-automatic handgun",
                        "9mm Kurz SIG Sauer P232 semi-automatic handgun",
                        "9mm Llama semi-automatic handgun",
                        "9mm Lorcin semi-automatic handgun",
                        "9mm Ruger P85 semi-automatic handgun",
                        "9mm Ruger P89 semi-automatic handgun",
                        "9mm Ruger semi-automatic handgun",
                        "9mm Ruger SR9 semi-automatic handgun",
                        "9mm semi-automatic handgun",
                        "9mm SIG Sauer P226 semi-automatic handgun",
                        "9mm SIG Sauer semi-automatic handgun",
                        "9mm Smith & Wesson 459 semi-automatic handgun",
                        "9mm Smith & Wesson 915 semi-automatic handgun",
                        "9mm Smith & Wesson semi-automatic handgun",
                        "9mm Springfield Armory XDM semi-automatic handgun",
                        "9mm Springfield semi-automatic handgun",
                        "9mm Taurus semi-automatic handgun",
                        "Beretta handgun",
                        "Black powder handgun (likely antique)",
                        "FN Five-seven semi-automatic handgun",
                        "Handgun (unspecified model)",
                        "Semi-automatic handgun",
                        "Springfield semi-automatic handgun",
                        "9mm Springfield XD-M semi-automatic handgun",
                        "Walther PP .380 handgun",
                        "Unknown handgun"
                    ]
                },
                'knife': {
                    data: ["6-inch `SRK` hunting knife",
                        "8-inch `Boar Hunter` hunting knife",
                        "Hunting knife",
                        "Unknown knife"
                    ]
                },
                'magazine': {
                    data: ["13-round magazine",
                        "25-round magazine",
                        "30-round magazine",
                        "High capacity magazine",
                        "Large-capacity magazine",
                        "Unknown magazine"
                    ]
                },
                'pistol': {
                    data: [".22 pistol (unknown model)",
                        ".25 semi-automatic pistol (unknown model)",
                        ".32 pistol (unknown model)",
                        ".38 pistol (unknown model)",
                        ".40 Taurus pistol",
                        ".45 pistol (unknown model)",
                        "9mm Glock 34 pistol",
                        "9mm pistol (unknown model)",
                        "9mm Walther semi-automatic pistol",
                        "FIE 380 Super Titan 2 pistol",
                        "Hi-Point CF-380 semi-automatic pistol",
                        "Intratec DC-9 semi-automatic assault pistol",
                        "Intratec MAC-11 semi-automatic assault pistol",
                        "MAC-10-style assault pistol",
                        "Sig Sauer P226 semi-automatic pistol",
                        "Springfield Armory 9mm semi-automatic pistol",
                        "Unknown pistol"
                    ]
                },
                'revolver': {
                    data: [".22 H&R Model 929 revolver",
                        ".22 Harrington & Richardson revolver",
                        ".22 Ruger Single Six revolver",
                        ".22 Sentinel WMR revolver",
                        ".32 revolver (unknown model)",
                        ".357 Magnum revolver",
                        ".357 Magnum Smith & Wesson revolver",
                        ".357 revolver (unknown model)",
                        ".357 Ruger Blackhawk revolver",
                        ".357 Ruger Security Six revolver",
                        ".38 Charter Arms revolver",
                        ".38 Colt revolver",
                        ".38 revolver (unknown model)",
                        ".38 Smith & Wesson M36 revolver",
                        ".38 Smith & Wesson Model 342 revolver",
                        ".38 Smith & Wesson revolver",
                        ".38 special revolver",
                        ".38 Taurus revolver",
                        ".44 Magnum Ruger revolver",
                        ".44 Magnum Smith & Wesson Model 29 revolver",
                        ".44 Magnum Smith & Wesson revolver (unknown model)",
                        "Unknown revolver"
                    ]
                },
                'rifle': {
                    data: [".22-250 bolt-action rifle with scope",
                        ".22 rifle (unknown model)",
                        ".22 rifle with scope",
                        ".22 Ruger rifle",
                        ".22 Ruger sawed-off semi-automatic rifle",
                        ".22 sawed-off rifle",
                        ".223 ArmaLite AR-15 semi-automatic rifle",
                        ".223 AR-15-type semi-automatic rifle (unknown model)",
                        ".223 Bushmaster XM15-E2S AR-15-type semi-automatic rifle",
                        ".223 Colt AR-15 semi-automatic rifle",
                        ".223 Daniel Defense AR-15-type semi-automatic rifle",
                        ".223 Del-Ton Sport AR-15-type semi-automatic rifle",
                        ".223 DPMS A-15 AR-15-type semi-automatic rifle",
                        ".223 FN Herstal AR-15-type semi-automatic rifle",
                        ".223 LMT AR-15-type semi-automatic rifle",
                        ".223 LWRC International AR-15-type semi-automatic rifle",
                        ".223 Noveske AR-15-type semi-automatic rifle",
                        ".223 POF-USA AR-15-type semi-automatic rifle",
                        ".223 Christensen Arms AR-15-type semi-automatic rifle w/ Wylde chamber",
                        ".223 Christensen Arms AR-15-type semi-automatic rifle",
                        ".223 AR-15-type rifle with home made silencer",
                        ".223 Ruger Mini-14 AR-15-type rifle",
                        ".223 Smith & Wesson M&P15 AR-15-type semi-automatic rifle",
                        ".223 Sturm Ruger Mini-14 AR-15-type semi-automatic rifle",
                        ".223 XM15 AR-15-type semi-automatic rifle",
                        ".30-06 Remington 742 rifle",
                        ".30-06 Ruger bolt-action rifle",
                        ".30 Universal M1 carbine replica rifle",
                        ".30 Universal M1 carbine rifle",
                        ".30 Winchester rifle",
                        ".308 AR-10-type rifle (unknown manufacturer)",
                        ".308 rifle (unknown model)",
                        ".308 Ruger American bolt-action rifle",
                        "5.45mm Izhmash Saiga AK-47-style semi-automatic rifle",
                        "7.62mm AK-47 Chinese variant semi-automatic rifle",
                        "9mm Hi-Point 995 carbine rifle",
                        "9mm Israeli Military Industries Uzi Model A carbine semi-automatic rifle",
                        "9mm Ruger 10/22 rifle",
                        "AK-47 assault rifle",
                        "AK-47 Chinese variant semi-automatic rifle",
                        "AK-47 Norinco Arms variant rifle",
                        "AK-47 Romarm Cugir variant rifle",
                        "AK-47-style semi-automatic rifle (unknown manufacturer)",
                        "AK-47 variant semi-automatic rifle (unknown model)",
                        "Illegally modified rifle",
                        "IWI Tavor SAR 5.56 rifle",
                        "Long gun (unspecified rifle)",
                        "M1 carbine assault rifle",
                        "MAK-90 semi-automatic rifle",
                        "Sig Sauer MCX rifle",
                        "SKS 1954s semi-automatic carbine rifle",
                        "SKS carbine rifle",
                        "WASR-10 Century Arms semi-automatic rifle",
                        "Zastava Serbia AK-47-style rifle",
                        "Unknown rifle"
                    ]
                },
                'shotgun': {
                    data: ["12-gauge Benelli semi-automatic shotgun",
                        "12-gauge Browning pump-action shotgun",
                        "12-gauge Izhmash Saiga-12 semi-automatic shotgun",
                        "12-gauge Mossberg pump-action shotgun",
                        "12-gauge pump-action shotgun",
                        "12-gauge Remington 870 Express shotgun",
                        "12-gauge Remington 870 pump-action shotgun",
                        "12-gauge Remington pump-action shotgun",
                        "12-gauge sawed-off Savage Springfield 67H pump-action shotgun",
                        "12-gauge sawed-off Savage Stevens 311D",
                        "12-gauge shotgun (unknown model)",
                        "12-gauge Winchester 1200 pump-action shotgun",
                        "12-gauge Winchester 1300 pump-action shotgun",
                        "12-gauge Winchester Defender pump-action shotgun",
                        "20-gauge Winchester pump-action shotgun",
                        "Assault-type shotgun (unknown model)",
                        "Mossberg 500 Persuader pump-action shotgun with pistol grip",
                        "Mossberg Maverick 88 Field shotgun",
                        "Pistol grip shotgun (unknown model)",
                        "Shotgun with extended tube",
                        "Unknown shotgun"
                    ]
                }
            },
            callback: {
                onInit: function(node) {
                    // node is the jquery input obj
                    console.log('Typeahead Initiated on ' + node.selector);
                    hasValue(node,'.typeahead__field');
                    
                    var el = node.closest('.form-element');
                    var list_id = 'list_' + node.attr('name');
                    
                    node.attr({
                        'aria-controls': list_id,
                        'aria-autocomplete': 'both'
                    });
                    // the el needs some basic aria features
                    el.attr({
                        'aria-expanded': false, 
                        'aria-haspopup': 'listbox',
                        'role': 'combobox',
                        'aria-owns': list_id
                    });
                },
                onNavigateAfter: function(node, lis, a, item, query, event) {
                    if (~[38, 40].indexOf(event.keyCode)) {
                        console.log('onNavigateAfter');
                        var index = $('li.active').data('index');
                        if(index !== undefined){
                            node.attr({
                                'aria-activedescendant': 'list_' + node.attr('name')+'_item_' + index
                            });
                        }else{
                            node.removeAttr('aria-activedescendant');
                        }
                        var list = node.closest('.form-element').find('ul.typeahead__list'),
                        activeLi = lis.filter("li.active"),
                        offsetTop = activeLi[0] && activeLi[0].offsetTop - (list.height() / 2) || 0;
                        list.scrollTop(offsetTop);
                    }
                },
                onClickAfter: function(node, a, item, event) {
                    event.preventDefault();
                    console.log('onClickAfter');
                    var el = node.closest('.form-element');
                    var group = item.group; //e.g. derringer
                    //set the radio check to the matching group
                    setRadios(el, group);
                    // auto add the lookup to the list
                    el.find('button.add').trigger('click');
                },
                onClick: function(node, a, item, event) {
                    console.log('onClick');
                    node.closest('.form-element').attr({'aria-expanded': false});
                    
                },
                onSubmit: function(node, form, item, event) {
                    console.log('onSubmit override function triggered');
                    event.preventDefault();
                    node.closest('.form-element').find('.add').trigger('click');
                    //prevent the typeahead submit action from firing
                    return false;
                },
                onResult: function(node, query, result, resultCount, resultCountPerGroup) {
                    console.log('onResult');
                    // also dynamically altering visible size of result box
                    watchTypeahead(node, resultCount);
                }
            }
        });
    }catch(err){
        console.warn(err);
    }
        
    var request;
    var g_sheet = 'https://docs.google.com/spreadsheets/d/16uvsJtEvZr6M2z4Fje74klaKZPvy5ans_InEm4LBYq0/edit?usp=sharing';
    var g_exec = 'https://script.google.com/macros/s/AKfycbzLJRPq9uUDsdaUGHPCNGfOpQk65q2zkf-mYFTGeotnZC4Nd-0/exec';
    // submit button note: type cannot be "submit" otherwise the browser kicks in and strict CORS crap happens
    $('button.submit')
        .on('click', function() {

            // if you make this "return false", we can add our own specific "please fill out this field" alert
            if (!precheckForm()) {
                // focus on the first error
                $('.form-has-error :input:first').focus();
                createSnackbar('<i data-icon="report_problem"></i>Please enter the required field', 'Dismiss');
                return false;
            }

            try {
                // abort any pending request
                if (request) {
                    request.abort();
                }
                // image title is disabled to prevent edit, reenable it
                $('[name="title"]').attr('disabled', false);

                // setup some local variables
                var form = getForm();
                // use the javascript get of the element not jquery
                var objFormData = new FormData(form.get(0));
                // get the inline data: text from the string we used by invoking FileReader() in readFILE()
                // its in the <image class="blob"> src attribute
                var objFile = '';
                // we have a canvas if canvas is supported
                if (isCanvasSupported()) {
                    if (!$('#undo').attr('src')) {
                        console.log('no image detected');
                    } else {
                        var data = $('#undo').attr('src');
                        var blobtype = data.substring(5, data.indexOf(';'));
                        objFile = $('.blob').get(0).toDataURL(blobtype);
                    }
                } else {
                    // just a backup for legacy browsers
                    // no editing can be done
                    objFile = $('.blob').attr('src');
                }
                // MUST BE APPEND AS FILE, (that is what the server google script is expecting)
                if(objFile!=''){
                    objFormData.append('file', objFile);
                }

                // let's disable the inputs for the duration of the ajax request
                // Note: we disable elements AFTER the form data has been serialized in .
                var inputs = form.find('input, button, select, textarea').prop("disabled", true);

                // show spinner
                toggleSpinner();

                // fire off the request to google sheet script listener
                request = $.ajax({
                        url: g_exec,
                        type: "POST",
                        data: objFormData,
                        enctype: 'multipart/form-data',
                        async: true,
                        processData: false,
                        contentType: false,
                        success: function(response) {
                            console.log('req SUCCESS fired');
                            console.log(response);
                            doReset();
                            createSnackbar('Success! Review the<a class="capslink" href="' + g_sheet + '" target="_blank">Google Sheet</a>', 'Dismiss');
                        }
                    });

                // callback handler that will be called on success
                request.done(function(response, textStatus, jqXHR) {
                    console.log('req DONE fired');
                });

                // callback handler that will be called on failure
                request.fail(function(jqXHR, textStatus, errorThrown) {
                    console.log('req FAIL fired');
                    var msg = 'The following error occured: ' + textStatus + '. Please check google server log';
                    createSnackbar(msg, 'Dismiss');
                    console.log(msg);
                });

                // if the request failed or succeeded
                request.always(function() {
                    console.log('req ALWAYS fired');
                    // hide the spinner
                    toggleSpinner();
                    // reenable the inputs
                    inputs.removeAttr('disabled').prop('disabled', false);
                });

            } catch (e) {
                console.log(e);
            }

        });

});
/* END JQUERY SPECIFIC CODE */

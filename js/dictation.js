/* polyfill so '.closest()' dom rule can work */
if (!Element.prototype.matches){
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
if (!Element.prototype.closest){
    Element.prototype.closest = function(s) {
        var el = this;
        if (!document.documentElement.contains(el)) return null;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1); 
        return null;
    };
}

function autoCapitalize(str,type) {
    type = (!type || type === null) ? 'null': type;
    if(type == 'sentences'|| type=='on'){
        return sentenceCase(str,false);
    }else if(type == 'words'){
        return wordCase(str, false);
    }else if(type=='off' || 'none'){
        return str.toLowerCase();
    }else if(type=='characters'){
        return str.toUpperCase();
    }else{
        return str;
    }
}
function sentenceCase(input, lowercaseBefore) {
    input = ( input === undefined || input === null ) ? '' : input;
    if (lowercaseBefore) { input = input.toLowerCase(); }
    return input.toString().replace( /(^|[\.\!\?\:] *)([a-z])/g, function(match, separator, char) {
        return separator + char.toUpperCase();
    });
}
function wordCase(input, lowercaseBefore){
    input = ( input === undefined || input === null ) ? '' : input;
    if (lowercaseBefore) { input = input.toLowerCase(); }
    return input.toString().replace( /(^|  *)([a-z])/g, function(match, separator, char) {
        return separator + char.toUpperCase();
    });        
}

// mobile detection is simple - can detect pc's with roatable screens but no biggie
var mobile = (function(){
    var ismobile = (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
    if(ismobile) document.body.classList.add('-ismobile');
    return ismobile;
})();

/* START Better Speech recogniton */
var hasDictate = ( document.querySelector('[data-buttons*="dictate"]') !== null ) ? true : false;
if(hasDictate){
    // init code example: https://www.google.com/intl/en/chrome/demos/speech.html
    // api ref: https://w3c.github.io/speech-api/speechapi.html
    // If you modify this array, also update "Set default language / dialect" index`s.
    var dictationModal = document.createElement('div');
    //<section id="dictation_modal" class="modal" aria-role="alertdialog">
    dictationModal.id = "dictation_modal";
    dictationModal.className = "modal";
    dictationModal.setAttribute('aria-role', 'dialog');
    
    var contents = '<button class="close round" title="Close dictation dialog"><i data-icon="arrow_back"></i></button>'+
            '<div id="dictation_content" class="modal-content">'+
                '<div class="compact marquee dialog-element">'+
                    '<div id="info">'+
                        '<p id="info_start" style="display:block">Click the microphone and speak.'+
                        '</p>'+
                        '<p id="info_continue" style="display:none">Click the microphone to add dictation.'+
                        '</p>'+
                        '<p id="info_speak_now" style="display:none">Listening...'+
                        '</p>'+
                        '<p id="info_no_speech" style="display:none">No speech was detected.'+
                            '<br>Check your <a href="//support.google.com/chrome/bin/answer.py?hl=en&amp;answer=1407892">microphone settings</a>.'+
                        '</p>'+
                        '<p id="info_no_microphone" style="display:none">No microphone was found.'+
                            '<br>Ensure that a microphone is installed and that <a href="//support.google.com/chrome/bin/answer.py?hl=en&amp;answer=1407892">microphone settings</a> are configured correctly.'+
                        '</p>'+
                        '<p id="info_allow" style="display:none">Click "Allow" to enable microphone.'+
                        '</p>'+
                        '<p id="info_denied" style="display:none">Microphone permission was denied.'+
                        '</p>'+
                        '<p id="info_blocked" style="display:none">Microphone permission is blocked.'+
                            '<br>To change, go to <a href="chrome://settings/content/microphone">chrome://settings/content/microphone</a>'+
                        '</p>'+
                        '<p id="info_upgrade" style="display:none">Web Speech API is not supported by this browser. Upgrade to <a href="//www.google.com/chrome">Chrome</a> version 25 or later.'+
                        '</p>'+
                    '</div>'+
                    '<div id="div_start" class="ring">'+
                        '<button tabindex="0" id="start_button" class="start-mic " title="Toggle dictation">'+
                             '<i data-icon="mic" style="display:none"></i>'+
                             '<i data-icon="mic_off"></i>'+
                             '<i data-icon="hearing" style="display:none"></i>'+
                             '<i data-icon="mic_none" style="display:none"></i>'+
                        '</button>'+
                    '</div>'+
                    '<div id="results">'+
                         '<span class="final" id="final_span"></span>'+
                         '<span class="interim" id="interim_span"></span>'+
                    '</div>'+
                    '<small id="info_placeholder" style="color: rgb(136, 136, 136); display: block;" class="form-element-hint"></small>'+
                    '<div id="copy" class="tools actions">'+
                        '<button type="button" id="cancel_button" title="Clear dictation" class="cancel round">'+
                             '<i data-icon="highlight_off"></i>'+
                        '</button>'+
                        '<button type="button" id="confirm_button" title="Confirm dictation" class="confirm round">'+
                             '<i data-icon="check_circle"></i>'+
                        '</button>'+
                    '</div>'+                      
                    '<div class="compact marquee" id="div_language">'+
                        '<div class="form-element">'+
                            '<label>Language</label>'+
                            '<select id="select_language" name="select_language" class="form-element-field">'+
                            '</select>'+
                        '</div>'+
                        '<div class="form-element">'+
                            '<label>Dialect</label>'+
                            '<select id="select_dialect" name="select_dialect" class="form-element-field">'+
                            '</select>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';

    dictationModal.innerHTML = contents;
    document.body.appendChild(dictationModal);
    
    // refs
    var info = document.getElementById('info');    
    var cancelButton = document.getElementById("cancel_button");
    var confirmButton = document.getElementById("confirm_button");
    var startButton = document.getElementById("start_button");    
    var closeButton = document.querySelector(".close");
    var resultsArea = document.getElementById("results");
    var modal = document.getElementById("dictation_modal");
    // hide confirm/cancel buttons initially
    showButtons('none');    
    // language array
    var langs = [
        ['Afrikaans', ['af-ZA']],
        ['አማርኛ', ['am-ET']],
        ['Azərbaycanca', ['az-AZ']],
        ['বাংলা', ['bn-BD', 'বাংলাদেশ'],
            ['bn-IN', 'ভারত']
        ],
        ['Bahasa Indonesia', ['id-ID']],
        ['Bahasa Melayu', ['ms-MY']],
        ['Català', ['ca-ES']],
        ['Čeština', ['cs-CZ']],
        ['Dansk', ['da-DK']],
        ['Deutsch', ['de-DE']],
        ['English', ['en-AU', 'Australia'],
            ['en-CA', 'Canada'],
            ['en-IN', 'India'],
            ['en-KE', 'Kenya'],
            ['en-TZ', 'Tanzania'],
            ['en-GH', 'Ghana'],
            ['en-NZ', 'New Zealand'],
            ['en-NG', 'Nigeria'],
            ['en-ZA', 'South Africa'],
            ['en-PH', 'Philippines'],
            ['en-GB', 'United Kingdom'],
            ['en-US', 'United States']
        ],
        ['Español', ['es-AR', 'Argentina'],
            ['es-BO', 'Bolivia'],
            ['es-CL', 'Chile'],
            ['es-CO', 'Colombia'],
            ['es-CR', 'Costa Rica'],
            ['es-EC', 'Ecuador'],
            ['es-SV', 'El Salvador'],
            ['es-ES', 'España'],
            ['es-US', 'Estados Unidos'],
            ['es-GT', 'Guatemala'],
            ['es-HN', 'Honduras'],
            ['es-MX', 'México'],
            ['es-NI', 'Nicaragua'],
            ['es-PA', 'Panamá'],
            ['es-PY', 'Paraguay'],
            ['es-PE', 'Perú'],
            ['es-PR', 'Puerto Rico'],
            ['es-DO', 'República Dominicana'],
            ['es-UY', 'Uruguay'],
            ['es-VE', 'Venezuela']
        ],
        ['Euskara', ['eu-ES']],
        ['Filipino', ['fil-PH']],
        ['Français', ['fr-FR']],
        ['Basa Jawa', ['jv-ID']],
        ['Galego', ['gl-ES']],
        ['ગુજરાતી', ['gu-IN']],
        ['Hrvatski', ['hr-HR']],
        ['IsiZulu', ['zu-ZA']],
        ['Íslenska', ['is-IS']],
        ['Italiano', ['it-IT', 'Italia'],
            ['it-CH', 'Svizzera']
        ],
        ['ಕನ್ನಡ', ['kn-IN']],
        ['ភាសាខ្មែរ', ['km-KH']],
        ['Latviešu', ['lv-LV']],
        ['Lietuvių', ['lt-LT']],
        ['മലയാളം', ['ml-IN']],
        ['मराठी', ['mr-IN']],
        ['Magyar', ['hu-HU']],
        ['ລາວ', ['lo-LA']],
        ['Nederlands', ['nl-NL']],
        ['नेपाली भाषा', ['ne-NP']],
        ['Norsk bokmål', ['nb-NO']],
        ['Polski', ['pl-PL']],
        ['Português', ['pt-BR', 'Brasil'],
            ['pt-PT', 'Portugal']
        ],
        ['Română', ['ro-RO']],
        ['සිංහල', ['si-LK']],
        ['Slovenščina', ['sl-SI']],
        ['Basa Sunda', ['su-ID']],
        ['Slovenčina', ['sk-SK']],
        ['Suomi', ['fi-FI']],
        ['Svenska', ['sv-SE']],
        ['Kiswahili', ['sw-TZ', 'Tanzania'],
            ['sw-KE', 'Kenya']
        ],
        ['ქართული', ['ka-GE']],
        ['Հայերեն', ['hy-AM']],
        ['தமிழ்', ['ta-IN', 'இந்தியா'],
            ['ta-SG', 'சிங்கப்பூர்'],
            ['ta-LK', 'இலங்கை'],
            ['ta-MY', 'மலேசியா']
        ],
        ['తెలుగు', ['te-IN']],
        ['Tiếng Việt', ['vi-VN']],
        ['Türkçe', ['tr-TR']],
        ['اُردُو', ['ur-PK', 'پاکستان'],
            ['ur-IN', 'بھارت']
        ],
        ['Ελληνικά', ['el-GR']],
        ['български', ['bg-BG']],
        ['Pусский', ['ru-RU']],
        ['Српски', ['sr-RS']],
        ['Українська', ['uk-UA']],
        ['한국어', ['ko-KR']],
        ['中文', ['cmn-Hans-CN', '普通话 (中国大陆)'],
            ['cmn-Hans-HK', '普通话 (香港)'],
            ['cmn-Hant-TW', '中文 (台灣)'],
            ['yue-Hant-HK', '粵語 (香港)']
        ],
        ['日本語', ['ja-JP']],
        ['हिन्दी', ['hi-IN']],
        ['ภาษาไทย', ['th-TH']]
    ];
    
    // inital settings and variables
    var final_transcript = '';
    var mobile_transcript = '';
    var recognizing = false;
    var ignore_onend;
    var start_timestamp;
    var g_target_input, g_autocapitalize='sentences';

    // 0 based count in array
    var g_english = 10;
    var g_united_states = 11;
    
    // build the initial language <select>
    for (var i = 0; i < langs.length; i++) {
        select_language.options[i] = new Option(langs[i][0], i);
        if(i == g_english){
            // dom update
            select_language.selectedIndex = i;
            // attribute update necessary for select_component.js
            select_language.options[i].setAttribute("selected", "selected");
            // run updateCountry() to create the dialects dropdown
            updateCountry();            
        }
    }

    // use strict due to eval statement
    function whichSpeechRecognition() {
        'use strict';
        var t;
        var rec_obj = {
            "W3": "SpeechRecognition",
            "O": "oSpeechRecognition",
            "Moz": "mozSpeechRecognition",
            "Webkit": "webkitSpeechRecognition",
            "MS": "msSpeechRecognition"
        }
        for (t in rec_obj) {
            if (rec_obj[t] in window) {
                console.log('window uses ' + rec_obj[t]);
                var rec = eval(rec_obj[t]);
                return new rec();
            }else{
                //console.log('window does not use ' +rec_obj[t]+ ', continue...');
            }
        }
        // only gets here if no speech recognition
        // Let the user know...
        if(mobile){
            createSnackbar('<i data-icon="mic_none"></i>Web Speech Recognition feature is not available. Please use the microphone button on the keyboard to fill in form fields.', 'Dismiss');
        }
        return false;
    }
    var recognition = whichSpeechRecognition();

    // SpeechRecognition is (kinda) future proofed - as of this writing, 
    // only `webkitSpeechRecognition` is supported (chrome and android mobile platforms)
    // ref: https://caniuse.com/#feat=speech-recognition
    if(!recognition){
        upgrade();
    }else{
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onstart = function() {
            if(!recognizing){
                recognizing = true;
                showInfo('info_speak_now');
                setMicIcon('hearing');
            }
        };
        recognition.onerror = function(event) {
            if (event.error == 'no-speech') {
                setMicIcon('mic_none');
                showInfo('info_no_speech');
            }
            if (event.error == 'audio-capture') {
                setMicIcon('mic_none');
                showInfo('info_no_microphone');
            }
            if (event.error == 'not-allowed') {
                if (event.timeStamp - start_timestamp < 100) {
                    setMicIcon('');
                    showInfo('info_blocked');
                } else {
                    setMicIcon('');
                    showInfo('info_denied');
                }
            }
            ignore_onend = true;
            /* other error events
            if(event.error == "aborted"){}
            if(event.error == "network"){}
            if(event.error == "service-not-allowed"){}
            if(event.error == "bad-grammar"){}
            if(event.error == "language-not-supported"){}
            */
            
        };
        recognition.onend = function(event) {
            recognizing = false;
    
            if (ignore_onend) {
                if(mobile){
                    // mobile updates onend
                    // we trigger the ignore_onend in onresult
                    final_transcript += mobile_transcript;
                    final_transcript = autoCapitalize(final_transcript,g_autocapitalize);
                    final_span.innerHTML = linebreak(final_transcript);
                    interim_span.innerHTML = '';
                    setMicIcon('mic_off');
                    showInfo('info_continue');
                }
                return;
            }
           
            if (!final_transcript) {
                // hit start before saying anything
                setMicIcon('mic_off');
                showInfo('info_start');
                return;
            }else{
                // stopping after saying something
                setMicIcon('mic_off');
                showInfo('info_continue');
            }
        };
        recognition.onresult = function(event) {
            var interim_transcript = '';
            
            if (typeof(event.results) == 'undefined') {
                recognition.onend = null;
                recognition.stop();
                showInfo('');
                upgrade();
                return;
            }
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if(mobile){
                    // mobile: isFinal always returns true for mobile so the work around is to let onend finish everything
                    // this method looks like shit on PC but works as desired on mobile
                    mobile_transcript = event.results[event.results.length-1][0].transcript;
                    interim_span.innerHTML = linebreak(mobile_transcript);
                    ignore_onend = true;
                }else{
                    if (event.results[i].isFinal) {
                        final_transcript += event.results[i][0].transcript;
                    } else {
                        interim_transcript += event.results[i][0].transcript;
                    }                
                }
            }
            // mobile code is handeled in onend
            if(!mobile){
                final_transcript = autoCapitalize(final_transcript,g_autocapitalize);
                final_span.innerHTML = linebreak(final_transcript);
                interim_span.innerHTML = linebreak(interim_transcript);
            }
            // dont need to check interim, we dont want a clickable button until final_transcript
            if (final_transcript!='' || mobile_transcript!='') {
                showButtons('inline-block');
            }
        };
    }
    
    // just put it in the console for the curious
    function upgrade(hide_buttons) {
        var hide_buttons = (!hide_buttons) ? true : hide_buttons;
        
        console.warn('Web Speech is not supported by this browser %s. Upgrade to Chrome v.25+ %s', 'http://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html', 'http://www.google.com/chrome' );
        start_button.style.visibility = 'hidden';
        showInfo('info_upgrade');
        info_placeholder.style.display = 'none';
        div_language.style.display = 'none';
        results.style.display = 'none';
        
        // show/hide the .dictate class button on page
        var dictates = document.getElementsByClassName('dictate');
        [].forEach.call(dictates, function(dictate){
            if(hide_buttons){
                dictate.style.display = 'none';
            }
        });   
    }
    
    var two_line = /\n\n/g, one_line = /\n/g, one_p = '<p></p>', one_br = '<br>', first_char = /\S/;
    function linebreak(s) {
      return s.replace(two_line, one_p).replace(one_line, one_br);
    }
    function newlines(s){
      return s.replace(one_p, '\n\n').replace(one_br, '\n');
    }
    function confirmOnClick(event){
        if (recognizing) {
            recognizing = false;
            recognition.stop();
        }
        //reverse the modal final text back to linebreaks?
        g_target_input.value = newlines(document.getElementById('final_span').innerHTML);
        // fire the change on the g_target_input so the listener knows to add .-hasvalue
        var _event = new Event('change');
        g_target_input.dispatchEvent(_event);
    
        toggleModal(event);
        // focus on the target input element
        g_target_input.focus();
        wrapup('mic_off', 'info_start');
    }
    function cancelOnClick() {
        if (recognizing) {
            recognizing = false;
            recognition.stop();
        }
        wrapup('mic_off', 'info_start');
    }
    function startOnClick(event) {
        if (recognizing) {
            recognition.stop();
            setMicIcon('mic_off');
            showInfo('info_continue');
            return;
        }
        // there may be two different values sources to select from
        var select_dialects = document.querySelector("label[aria-selected=true] input[name=select_dialect]");

        recognition.lang = (select_dialects == null) ? select_dialect.value : select_dialects.value;

        console.log('dictation language: %s', recognition.lang);
        
        try{recognition.start()}catch(err){upgrade()}
            start_timestamp = event.timeStamp;
        if(final_transcript!=''){
            final_transcript += ' ';
        }
    }
    function toggleModal(event) {        
        var triggers = document.querySelectorAll(".dictate");
        // toggle the modal
        modal.classList.toggle("show-modal");
        // only do a startDictation() if a .dictate button is clicked  
        triggers.forEach(function(trigger){
            // the event.target is 'i' so the parentElement is the .dictate button that was pressed
            if(event.target.parentElement === trigger){
                event.preventDefault;
                //send the event parent element (the button that was clicked) to a function
                startDictation(trigger);
                startButton.focus();
            }
        });
    }
    function closeOnClick(event){
        toggleModal(event);
        cancelOnClick();
        //var _event = new Event('focus');
        //g_target_input.dispatchEvent(_event);
        g_target_input.focus();
    }
    function updateCountry() {
        // if listening  - stop
        // console.log('updateCountry()');
        if (recognizing) {
            recognition.stop();
            setMicIcon('mic_off');
            showInfo('info_continue');
        }
        // if a <select> with options
        if(select_dialect.options){
            //reset the disabled
            console.log('creating <select>');
            select_dialect.removeAttribute('disabled');
            // clear out old values
            for (var i = select_dialect.options.length - 1; i >= 0; i--) {
                select_dialect.remove(i);
            }
            // determine index then the sub array values to add option(s) to #select_dialect
            var list = langs[selectedLangIndex()];
            // console.log(list);
            for (var i = 1; i < list.length; i++) {
                //console.log(list[i][1], list[i][0]);
                var key = (list[i][1] === undefined) ? '-' : list[i][1];
                var val = list[i][0];
                select_dialect.options.add(new Option(key, val));
            }

            // console.log(list[1].length == 1);
            // disable the dropdown if only one in the sublist 
            if(list[1].length == 1){                
                select_dialect.selectedIndex = 0;
                select_dialect.options[0].setAttribute('selected', 'selected');
                select_dialect.options[0].setAttribute('disabled', 'disabled');
                select_dialect.setAttribute('disabled', 'disabled');
            }
            // 10 == english
            if(selectedLangIndex() == g_english){
                select_dialect.selectedIndex = g_united_states;
                select_dialect.options[g_united_states].setAttribute('selected', 'selected');
            }
            // add a listener in for no select conversion
            select_dialect.removeEventListener('focus', cancelOnClick);
            select_dialect.addEventListener('focus', cancelOnClick);
        }else{
            // its been converted via select_component.js
            // find the form-element parent
            console.log('removing #select_dialect');
            var form_element = document.getElementById('listbox_select_dialect').closest('.form-element');
            // clear out old select
            form_element.innerHTML='';
            
            // make a new select and add
            var select = document.createElement('SELECT');
            select.setAttribute('id', 'select_dialect');
            select.setAttribute('name', 'select_dialect');
            select.className = 'form-element-field -hasvalue';
            form_element.appendChild(select);
            
            updateCountry();// send it back through to fill the option values
            
            // 10 = english
            if(selectedLangIndex() == g_english){
               $('#select_dialect option:nth('+g_united_states+')').attr({'selected': 'selected'});//en-us
            }else{
               $('#select_dialect option:first').attr({'selected': 'selected'});
            }
            
            // make the <select> back into checkboxes
            selectMachine($('#select_dialect'));
            
            // This is specific to a .form-elements themed page
            var bar = document.createElement('DIV');
            bar.className = 'form-element-bar';
            form_element.appendChild(bar);
            
            var label = document.createElement('LABEL');
            label.setAttribute('for', 'select_dialect');
            label.innerText = 'Dialect';
            label.className = 'form-element-label';
            form_element.appendChild(label);
            
            // initial load has a label
            // nice little bonus label left over from select_component.js - remove it
            $(form_element).find('label:not([role="option"]):first').remove();
            
            // add listener back on
            $('input[name="select_dialect"]').on('focus', cancelOnClick);
            
        }
    }
    
    /*these listeners work only if there is no transformation*/
    select_language.addEventListener('change', updateCountry);
    
    // these are static
    cancelButton.addEventListener("click", cancelOnClick);
    confirmButton.addEventListener("click", confirmOnClick);
    startButton.addEventListener("click", startOnClick);
    resultsArea.addEventListener("click", startOnClick);
    closeButton.addEventListener("click", closeOnClick);
    window.addEventListener("click", function(e){
        if (e.target === modal) {
            closeOnClick(e);
        }
        return false;
    });
    window.addEventListener("keydown", function(e) {
        if(e.target === closeButton){
            // shift tab past the close button
            if(e.shiftKey && e.keyCode == 9){
                e.preventDefault();
                closeOnClick(e);
            }
        }
    });
    
    function selectedLangIndex(){
        var select_languages = document.querySelectorAll("input[name=select_language]");
        var selectedIndex = 0;
        // determine if radio inputs are present so the proper selected can be found 
        if(select_languages.length > 0){
            // if radios found find selected index
            for (var i = 0; i < select_languages.length; i++){
                // check the <radio> 
                var label = select_languages[i].parentElement;
                if(label.getAttribute("aria-selected") == "true"){
                    selectedIndex = i;
                }
            }
        }else{
            // if its a default <select> element
            selectedIndex = select_language.selectedIndex;
        }
        //console.log(selectedIndex);
        return selectedIndex;
    }
    function wrapup(mic, info){
        final_transcript = '';
        mobile_transcript = '';
        ignore_onend = false;
        final_span.innerHTML = '';
        interim_span.innerHTML = '';
        setMicIcon(mic);
        showInfo(info);
        showButtons('none');   
    }
    function setMicIcon(s){
        if (s) {
            start_button.style.visibility = 'visible';
        } else {
            start_button.style.visibility = 'hidden';
        }
        var icons = start_button.querySelectorAll("i");
        [].forEach.call(icons, function(icon){
            if(icon.dataset.icon == s){
                icon.style.display = 'block';
            }else{
                icon.style.display = 'none';
            }
        });
    }
    function showInfo(s) {
        // possible entries (<p> #id) in html
        // 'info_upgrade','info_allow','info_start','info_continue',
        // 'info_no_speech','info_no_microphone','info_blocked',
        // 'info_denied','info_speak_now','info_placeholder'        
        if (s) {
            for (var child = info.firstChild; child; child = child.nextSibling) {
                if (child.style) {
                    child.style.display = (child.id == s || child.id == 'info_placeholder') ? 'block' : 'none';
                }
            }
            info.style.visibility = 'visible';
        } else {
            info.style.visibility = 'hidden';
        }
    }
    function showPlaceholder(s){
        var placeholder = document.getElementById('info_placeholder');
        placeholder.innerText = s;
    }    
    var current_style;
    function showButtons(style) {
        if (style == current_style) {
            return;
        }
        current_style = style;
        cancel_button.style.display = style;
        confirm_button.style.display = style;
    }
    
    // identifies the text <input> (.form-element) closest to the .dictate button
    // triggers the initial click on the listen button
    function startDictation(whichButton) {
        //console.log('start Dictation');
        // climb the dom to find the parent .form-element div
        var el = whichButton.closest(".form-element");
        
        // place the target element in the global variable so we can focus on it when the modal is closed
        g_target_input = el.querySelector('.form-element-field');// gets the first one vs .querySelectorAll
        // each target element may have an autocapitalize attribute, which helps the mobile keyboard,
        // we are utilizing it to work for capitalization on PC. We can also use it
        // for our dictation preview.
        console.log('dictation results target: name=%s', g_target_input.getAttribute('name'));
        
        g_autocapitalize = g_target_input.getAttribute('autocapitalize');
        
        console.log('dictation auto capitalizing: %s', g_autocapitalize);
    
        // grab the placeholder text
        var placeholder = (g_target_input.getAttribute('placeholder')!== null) ? g_target_input.getAttribute('placeholder') : '';
        
        //put the placeholder text into the modal
        showPlaceholder(placeholder);
        
        // highlight the mic button in the modal, and trigger first click 
        startButton.click();
    }
    /* END Better Speech recogniton */
}
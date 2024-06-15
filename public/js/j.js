function StateSelect(selectContainerId, selectId, textContainerId, textId) {
    var states = {"CN":[["AH","Anhui"],["BJ","Beijing"],["CQ","Chongqing"],["FJ","Fujian"],["GS","Gansu"],["GD","Guangdong"],["GX","Guangxi"],["GZ","Guizhou"],["HI","Hainan"],["HE","Hebei"],["HL","Heilongjiang"],["HA","Henan"],["HB","Hubei"],["HN","Hunan"],["JS","Jiangsu"],["JX","Jiangxi"],["JL","Jilin"],["LN","Liaoning"],["NM","Nei Mongol"],["NX","Ningxia"],["QH","Qinghai"],["SN","Shaanxi"],["SD","Shandong"],["SH","Shanghai"],["SX","Shanxi"],["SC","Sichuan"],["TJ","Tianjin"],["XJ","Xinjiang"],["XZ","Xizang"],["YN","Yunnan"],["ZJ","Zhejiang"]]};
    var $selectContainer = $('#' + selectContainerId);
    $selectContainer.hide().removeClass('hidden');
    var $select = $('#' + selectId);
    var $textContainer = $('#' + textContainerId);
    var $text = $('#' + textId);
    var readonly = $text.hasClass('readonly');
    var originalValue = $text.val();

    function findIndex(country, state) {
        if (country == null || state == null || states[country] == null) return -1;
        for (var i = 0; i < states[country].length; i++) {
            if (states[country][i][0].toUpperCase() === state.toUpperCase()) {
                return i;
            }
        }
        return -1;
    }

    function hideSelect() {
        $selectContainer.hide();
        $select.prop('disabled', true);
        if (!readonly) $select.prop("selectedIndex", -1);
    }

    function showSelect() {
        if (!readonly) {
            $select.prop('disabled', false);
        } else {
            $select.val(originalValue);
        }
        $selectContainer.show();
    }

    function hideText() {
        $textContainer.hide();
        $text.prop('disabled', true);
        if (!readonly) $text.val('');
    }

    function showText() {
        if (!readonly) {
            $text.prop('disabled', false);
        } else {
            $text.val(originalValue);
        }
        $textContainer.show();
    }

    function hide() {
        hideSelect();
        hideText();
    }

    function update(country, state) {
        state = readonly ? originalValue : state;
        var index = findIndex(country, state)

        if (states[country] == null || (index < 0 && (state || '').length > 0)) {
            hideSelect();
            showText();
            return;
        }

        hideText();
        $select.empty();
        $.each(states[country], function (i, item) {
            $select.append($('<option>', {
                value: item[0],
                text : item[1]
            }));
        });
        $select.prop("selectedIndex", index);
        showSelect();
    }

    return {
        hide: hide,
        update: update
    };
}
/**********************************************************************
 * Copyright 2012 CyberSource Corporation.  All rights reserved.
 **********************************************************************/
var allBillingStates = {};
var billingStateDER;
var billingStateUsCaDER;
var billingCountry;
var billingCountryName;

var $billToAddressCountry;
var $billToAddressState;
var $billToAddressStateUsCa;
var $billingStateContainerUsCa;
var $billingStateContainer;

var billingStateSelect;

function saveBillingStates() {
    $('#bill_to_address_state_us_ca optgroup').each(
            function () {
                label = $(this).attr("label");
                var options = getBillingOptions($(this));
                allBillingStates[label] = options;
            });
}
function getBillingOptions(optgroup) {
    var options = new Array();
    $('option', optgroup).each(
            function () {
                options.push($(this).get(0));
            }
    );
    return options;
}

//Function removes states that are not associated with selected country i.e. US or CANADA
function populateBillingSelect(country, resetSelectedOption) {
    var statesSelect = $billToAddressStateUsCa;
    var states = allBillingStates[country];

    // Remove all items
    statesSelect.children().remove();

    if (states != null) {
        // Add in selected countries states
        var len = states.length;
        for (var i = 0; i < len; i++) {
            var value = states[i];
            statesSelect.append(value);
        }
    }

    // Select first item in list if country was changed - which is 'select a state'
    if (resetSelectedOption) {
        statesSelect.prop("selectedIndex", -1);
    }
    // Redraw list
    statesSelect.trigger("liszt:updated");
}

function showCorrectBillingStateField(resetBillingState){

    if (billingCountry === 'US' || billingCountry === 'CA') {
        if (billingStateUsCaDER.display) {
            $billToAddressStateUsCa.prop("disabled", !billingStateUsCaDER.edit);
            populateBillingSelect(billingCountryName, resetBillingState);
            $billingStateContainerUsCa.show();
        }else{
            $billingStateContainerUsCa.hide();
            $billToAddressStateUsCa.prop('disabled', true);
        }
        $billingStateContainer.hide();
        $billToAddressState.prop('disabled', true);
        if (resetBillingState && billingStateDER.edit) {
            $billToAddressState.val("")
        }

        if ( !billingStateUsCaDER.edit  && !$billToAddressStateUsCa.val()){
            $billingStateContainerUsCa.hide();
        }

        billingStateSelect.hide();
    } else {
        $billingStateContainerUsCa.hide();
        $billToAddressStateUsCa.prop('disabled', true);

        if (resetBillingState && billingStateDER.edit) {
            $billToAddressState.val("");
        }

        $billToAddressState.prop("disabled", !billingStateDER.edit);
        if (billingStateDER.display) {
            $billingStateContainer.show();
        }

        if (!billingStateDER.edit && !$billToAddressState.val()){
            $billingStateContainer.hide();
            billingStateSelect.hide();
        }

        billingStateSelect.update(billingCountry, $billToAddressState.val());
    }

    if ( billingStateDER.display !== billingStateUsCaDER.display ) {
        if ( $('form li.firsthalf').length === 0 ) return;

        var invertClass = {
            "firsthalf" : "secondhalf",
            "secondhalf" : "firsthalf"
        };

        var dependentField = $( $billToAddressCountry.attr("data-dependent-field") );
        var relativeField = dependentField.prev("li");

        var dependentFieldClass = relativeField.attr("class")

        dependentField
                .removeClass('firsthalf secondhalf')
                .addClass( relativeField.is(":visible") ? invertClass[dependentFieldClass] : dependentFieldClass );
    }

}

$(function ($) {
    $billToAddressCountry = $('#bill_to_address_country');
    $billToAddressStateUsCa = $('#bill_to_address_state_us_ca');
    $billToAddressState = $('#bill_to_address_state');
    $billingStateContainerUsCa = $('#billing_state_container_us_ca');
    $billingStateContainer = $('#billing_state_container');

    billingStateDER = {
        display: false,
        edit : false,
        required: false
    };

    billingStateUsCaDER = {
        display: true,
        edit : true,
        required: true
    };

    billingCountry = '';
    billingCountryName = 'Translation missing: en.country_';
    var isStateInitiallyEmpty = true;

    billingStateSelect = StateSelect('billing_state_select_container', 'bill_to_address_state_select', 'billing_state_text_container', 'bill_to_address_state');

    // Save states so that we can filter them out based on country
    saveBillingStates();
    showCorrectBillingStateField(isStateInitiallyEmpty);

    // Update state display on change of country
    $billToAddressCountry.change(function () {
        billingCountry = this.value;
        billingCountryName = $('#bill_to_address_country option:selected').text();
        showCorrectBillingStateField(true);
    });

    $billToAddressCountry.on('blur', function () {
        bill_to_address_country_validator.validate();
    });

var bill_to_forename_validator = new LiveValidation('bill_to_forename', {
    onlyOnBlur: true,
    messageElementId: 'bill_to_forename_error'
});
bill_to_forename_validator.add(Validate.Presence, { failureMessage: "First name is a required field" });
bill_to_forename_validator.add(Validate.Length, {  maximum: 60, tooLongMessage: "Enter a valid first name" });

var bill_to_surname_validator = new LiveValidation('bill_to_surname', {
    onlyOnBlur: true,
    messageElementId: 'bill_to_surname_error'
});
bill_to_surname_validator.add(Validate.Presence, { failureMessage: "Last name is a required field" });
bill_to_surname_validator.add(Validate.Length, {  maximum: 60, tooLongMessage: "Enter a valid last name" });


var bill_to_address_line1_validator = new LiveValidation('bill_to_address_line1', {
    onlyOnBlur: true,
    messageElementId: 'bill_to_address_line1_error'
});
bill_to_address_line1_validator.add(Validate.Presence, { failureMessage: "Address is a required field" });
bill_to_address_line1_validator.add(Validate.Length, {  maximum: 60, tooLongMessage: "Enter a valid address" });

var bill_to_address_line2_validator = new LiveValidation('bill_to_address_line2', {
    onlyOnBlur: true,
    messageElementId: 'bill_to_address_line2_error'
});
bill_to_address_line2_validator.add(Validate.Length, {  maximum: 60, tooLongMessage: "Enter a valid address" });

var bill_to_address_city_validator = new LiveValidation('bill_to_address_city', {
    onlyOnBlur: true,
    messageElementId: 'bill_to_address_city_error'
});
bill_to_address_city_validator.add(Validate.Presence, { failureMessage: "City is a required field" });
bill_to_address_city_validator.add(Validate.Length, {  maximum: 50, tooLongMessage: "Enter a valid city" });

if ($billToAddressCountry.length) {
    var bill_to_address_country_validator = new LiveValidation('bill_to_address_country', {
        messageElementId: 'bill_to_address_country_error',
        insertAfterWhatNode: 'bill_to_address_country',
        nodeToMark: 'bill_to_address_country'
    });
    bill_to_address_country_validator.add(Validate.Presence, { failureMessage: "Country/Region is a required field" });
}

if ($billToAddressStateUsCa.length) {
    var bill_to_address_state_us_ca_validator = new LiveValidation('bill_to_address_state_us_ca', {
        onlyOnSubmit: true,
        messageElementId: 'bill_to_address_state_us_ca_error',
        insertAfterWhatNode: 'bill_to_address_state_us_ca',
        nodeToMark: 'bill_to_address_state_us_ca'
    });
        bill_to_address_state_us_ca_validator.add(Validate.Presence, { failureMessage: "State is a required field" });
}

if ($billToAddressState.length) {
    var bill_to_address_state_validator = new LiveValidation('bill_to_address_state', {
        onlyOnBlur: true,
        messageElementId: 'bill_to_address_state_error',
        insertAfterWhatNode: 'bill_to_address_state',
        nodeToMark: 'bill_to_address_state'
    });
}

var bill_to_phone_validator = new LiveValidation('bill_to_phone', {
    onlyOnBlur: true,
    messageElementId: 'bill_to_phone_error'
});
bill_to_phone_validator.add(Validate.Format, { pattern: /^[\d\s(),+-.*#xX]*$/, failureMessage: "Enter a valid phone number" });
bill_to_phone_validator.add(Validate.Custom, {  against: function (value, args) {
    var strippedBillToPhoneLength = value.replace(/\D/g, '').length;
    return strippedBillToPhoneLength >= 6 && value.length <= 15; 
},
    failureMessage: "Enter a valid phone number"
});


var bill_to_address_postal_code_validator = new LiveValidation('bill_to_address_postal_code', {
    onlyOnBlur: true,
    messageElementId: 'bill_to_address_postal_code_error'
});
bill_to_address_postal_code_validator.add(Validate.Custom, {  against: function (value, args) {
        var countrySymbol = $billToAddressCountry.val();
        if (countrySymbol === "US") {
            return value.replace(/[^0-9]/,"").length <= 9;
        } else if (countrySymbol === "CA") {
            return /^([abceghjklmnprstvxy][0-9][abceghjklmnprstvwxyz][-\s]?[0-9][abceghjklmnprstvwxyz][0-9])$/i.test(value);
        }
        return value.length <= 10;
    },
    failureMessage: "Enter a valid postal code"
});

var bill_to_email_validator = new LiveValidation('bill_to_email', {
    onlyOnBlur: true,
    messageElementId: 'bill_to_email_error'
});
bill_to_email_validator.add(Validate.Presence, { failureMessage: "Email address is a required field" });
bill_to_email_validator.add(Validate.Length, {  maximum: 255, tooLongMessage: "Enter a valid email address" });
bill_to_email_validator.add(Validate.Custom, {  against: function (value, args) {
    if (/\s+/.test(value)) return false;

    var atIndex =  value.indexOf('@');
    if (atIndex < 1 || atIndex != value.lastIndexOf('@')) return false;

    var lastDotIndex = value.lastIndexOf('.');
    if (lastDotIndex <= atIndex + 1 || lastDotIndex == value.length - 1) return false;

    return true;
},
    failureMessage: "Enter a valid email address"
});

});

var sessionTimer = (function () {

    var sessionTimeoutInterval,
        serverSessionKeepAliveInterval

    var timerConfig = {
        refreshAttempts: 10,
        timeAfterWhichDialogShouldBeShown: 14.3 * 60 * 1000,
        durationToDisplayDialog: 30 * 1000,
        timeAfterWhichServerKeepAliveShouldOccur: 5 * 60 * 1000
    };

    $(function ($) {
        startClientSideSessionTimeout();

        $('.cancelbutton').on('click', function(e) {
            var prevFocus = $(e.target);
            $("#cancel-order-dialog").dialog({
                dialogClass: "no-close",
                buttons: {
                    'Yes': function () {
                        $('input[type=submit]').prop('disabled', true);
                        $('.pay_button').prop('disabled', true);
                        $('.cancelbutton').prop('disabled', true);
                        window.location.assign("/canceled");
                        $(this).dialog('close');
                    },
                    'No': function () {
                        $(this).dialog('close');
                        $("#cancel-order-dialog").dialog("destroy");
                        prevFocus.focus();
                    }
                },
                modal: true  });
        });
    });

    function startClientSideSessionTimeout() {
        var timer,
            refreshesRemaining =  timerConfig.refreshAttempts;

        sessionTimeoutInterval = setInterval(
                function () {
                    if (refreshesRemaining >0){
                        $(document.body).append("<div id=\"dialog-message\" style=\"display: none\" title=\"Page about to close\" aria-describedby=\"session_timeout_dialog_description\"><span id=\"session_timeout_dialog_description\">It appears you are not currently active on this page.<br><br>For security reasons this page will close.  To prevent this, click the below button.</span></div>")
                        var timeoutError = document.getElementById("dialog-message")
                        var prevFocus = document.activeElement;
                        $("#dialog-message").dialog({
                            dialogClass: "no-close",
                            buttons: {
                                'Stay on page': function () {
                                    timeoutError.remove(timeoutError);
                                    initiateServerSessionKeepAlive();

                                    refreshesRemaining--;
                                    clearTimeout(timer);
                                    $(this).dialog('close');
                                    var prevSibling = prevFocus.previousElementSibling;
                                    if (prevSibling != null && prevSibling.getAttribute('id') != null){
                                        prevFocus.previousElementSibling.focus()
                                    } else if(prevFocus != null) {
                                        prevFocus.focus();
                                    }
                                    $("#dialog-message").dialog("destroy");
                                }
                            },
                            modal: true,
                            open: timer = setTimeout(function (event, ui) {
                                clearInterval(sessionTimeoutInterval);
                                $("#dialog-message").dialog("close");
                                window.location.assign("/timeout");
                            }, timerConfig.durationToDisplayDialog)

                        });
                        $(".ui-dialog.no-close button[title='Close']").remove();
                    }
                    else{
                        window.location.assign("/timeout");
                    }
                },
                timerConfig.timeAfterWhichDialogShouldBeShown
        );
    }

    function preventClientSideSessionTimeout() {
        clearInterval(sessionTimeoutInterval);
    }

    function startServerSessionPeriodicKeepAlive() {
        serverSessionKeepAliveInterval = setInterval(initiateServerSessionKeepAlive, timerConfig.timeAfterWhichServerKeepAliveShouldOccur);
    }

    function stopServerSessionPeriodicKeepAlive() {
        clearInterval(serverSessionKeepAliveInterval);
    }

    function initiateServerSessionKeepAlive() {
        var myImg = $('#keep_alive');
        myImg.attr("src", myImg.attr("src") + '?' + Math.random());

        if (isEmbedded()){
            refreshCache();
        }
    }

    function isEmbedded() {
        return window.location.href.indexOf('/embedded/') > -1;
    }

    function refreshCache(){
        $.post( "/extend-embedded?sessionid=622", { session_uuid: '2712b8154e134159b801c1c51018fa71' } );
    }

    return {
        startClientSideSessionTimeout: startClientSideSessionTimeout,
        preventClientSideSessionTimeout: preventClientSideSessionTimeout,
        startServerSessionPeriodicKeepAlive: startServerSessionPeriodicKeepAlive,
        stopServerSessionPeriodicKeepAlive: stopServerSessionPeriodicKeepAlive
    };

})();

function displayTerms(e, terms) {
    var prevFocus = $(e.target);
    $("." + terms + "_dialog").dialog({
        dialogClass: "no-close",
        buttons: {
            'Print': function () {
                window.print();
            },
            'Back': function () {
                $(this).dialog('close');
                prevFocus.focus();
                $("." + terms + "_dialog").dialog("destroy");
            }
        },
        modal: true  });
};

function isIE() {
    return (navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true);
}

$(function ($) {
    var commit_button = $('input[name="commit"]');
    if (commit_button.length) {
        $(document).keydown(function (e) {
            if (e.which === 13) {
                var target = $(e.target);

                if(commit_button.prop("disabled") == false) {
                    if (target.is(":submit, :button")) {
                        target.click();
                        return false;
                    }
                    if (target.is("select") && isIE()) {
                        return true;
                    } else if (target.is("a")) {
                        target.click();
                        return true;
                    }
                    commit_button.click();
                    return false;
                }
            }
        });
    }
});

$(function ($) {
    $('input[type=submit][name=back]')
            .on('submit click', function (event) {
                $(this)[0].form.onsubmit = function(e) {
                    return true;
                };
            });
});

$(function ($) {
    $("[class~='error']").each(function(index) {
        var $this = $(this);
        $.each($this.attr("class").split(/\s+/), function () {
            if (this.indexOf('server-error-') == 0) {
                var fieldName = this.slice(13);
                var $field = $("[class~='field-" + fieldName + "']");
                if ($field.length < 1) return;
                $field.attr('aria-invalid', 'true');
                var describedBy = $field.attr('aria-describedby') || '';
                $field.attr('aria-describedby', (describedBy.length < 1 ? '' : ' ') + $this.attr('id'));
                $field.addClass('failedOnce');
            }
        });
    });

    var formsLV = Object.keys(LiveValidationForm.instances);
    if (formsLV.length === 1) {
        var errMsgs = {
            'multiple_sections_1': 'You have one or more errors in the following section(s): ',
            'multiple_sections_2': 'Please fix to continue.',
            'section_billing': 'You have one or more errors in your billing information. Please fix to continue.',
            'section_shipping': 'You have one or more errors in your shipping information. Please fix to continue.',
            'section_payment': 'You have one or more errors in your payment details. Please fix to continue.',
            'generic': 'You have one or more errors. Please fix to continue.'
        };
        var sectionNames = {
            'billing': 'Billing Information',
            'shipping': 'Shipping Information',
            'payment': 'Payment Details'
        }

        var $banner = $('.error-banner');
        var $bannerVldn = $banner.filter('.validation');
        var $bannerVldnSS = $bannerVldn.filter('.section');
        var $bannerVldnMS = $bannerVldn.filter('.multiple-sections');
        LiveValidationForm.instances[formsLV[0]].doAfterValidate = function (valid) {
            if (valid) {
                $bannerVldn.addClass('hidden').removeAttr('role');
                $bannerVldn.find('p').text(null);
                return;
            }

            var badSections = [];
            $('.errorborder').filter(':visible').filter(':not(:disabled)').each(function(index) {
                var $this = $(this);
                var id = $this.attr('id');
                var section = 'payment';
                if (id.indexOf('bill_') == 0) {
                    section = 'billing';
                } else if (id.indexOf('ship_') == 0) {
                    section = 'shipping';
                }

                if (badSections.indexOf(section) < 0) {
                    badSections.push(section);
                }
            });

            if ($bannerVldnMS.length > 0) {
                if (badSections.length > 0) {
                    $bannerVldnMS.removeClass('hidden').attr('role', 'alert');
                    var errMsgMS = errMsgs['multiple_sections_1'];
                    for (var i = 0; i < badSections.length; i++) {
                        errMsgMS += sectionNames[badSections[i]] + '; ';
                    }
                    errMsgMS = errMsgMS.replace(/; $/, '. ') + errMsgs['multiple_sections_2'];
                    $bannerVldnMS.find('p').text(errMsgMS);
                } else {
                    $bannerVldnMS.addClass('hidden').removeAttr('role');
                    $bannerVldnMS.find('p').text(null);
                }
            }

            $bannerVldnSS.addClass('hidden');
            $bannerVldnSS.find('p').text(null);
            for (var i = 0; i < badSections.length; i++) {
                var section = badSections[i];
                var $bannerSection = $('.error-banner.validation.' + section);
                $bannerSection
                    .removeClass('hidden')
                    .find('p').text($bannerSection.hasClass('generic') ? errMsgs['generic'] : errMsgs['section_' + section]);
            }
            var $bannerVldnSSGnVis;
            if ($bannerVldnMS.length < 1 && ($bannerVldnSSGnVis = $bannerVldnSS.filter('.generic').filter(':not(.hidden)')).length > 0) {
                $bannerVldnSSGnVis.first().attr('role', 'alert');
            }
        };

        LiveValidationForm.instances[formsLV[0]].doAfterValidate($('.errorborder').filter(':visible').length < 1);
    }
});

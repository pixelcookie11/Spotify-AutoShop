init();
function init() {
    $.getJSON("/stock/spotify", function (data) {
        $.each(data, function (i, p) {
            $("option[value='']").remove();
            $('#country').append($('<option></option>').val(p.COUNTRY).html(p.COUNTRY));
        })
    });
}

function setDiscord() {
    document.getElementById('contactMethodLabel').innerHTML = 'Discord Tag:';
    document.getElementById("contactMethod").placeholder = "Wumpus#1337";
    document.getElementById("discordInfo").style.visibility = 'visible';
}

function setEmail() {
    document.getElementById('contactMethodLabel').innerHTML = 'Email:';
    document.getElementById("contactMethod").placeholder = "me@example.com";
    document.getElementById("discordInfo").style.visibility = 'hidden';
}

function buy() {

    if (document.getElementById("contactMethod").value == "") {
        alert('You need to provide a contact method.');
        return;
    }
    document.getElementById("submitButton").style.display = "none";
    document.getElementById("spinner").style.display = "";
    var sel = document.getElementById("country");
    var selectedCountry = sel.options[sel.selectedIndex].text;
    var contactMethod = document.getElementById("contactMethod").value
    var data = {
        country: selectedCountry,
        contactInfo: contactMethod
    }
    $.ajax({
        url: '/buy/spotify',
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            window.open(data, "_self");
        },
        data: JSON.stringify(data),
    });
}

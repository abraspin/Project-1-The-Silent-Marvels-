// This is the API key I set up through Google
var apiKey = "AIzaSyBXaAKr4axxaUBPZXJD-cKQF9qtHVrzXe0";

// Toggle modal active by using click listener on find-bar-button
$("#find-bar-button").on("click", function() {
    event.preventDefault();
    $(".modal").addClass("is-active");
});

// Select the user input for each field on the modal
$("#submit-button").on("click", function() {
    event.preventDefault();
    var zipOnly = $("#zip-only").val();
    if (zipOnly) {
        console.log("ZIP Only: " + zipOnly);
        // Build the query URL
        // Search parameters start after the q= and use either + or %20 to escape spaces
        var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=bars+near+${zipOnly}`;
        console.log("QueryURL: " + queryURL);
    } else {
        var address = $("#address").val().trim();
        address = address.replace(/ /g, "+");
        console.log("Address: " + address);
        var city = $("#city").val().trim();
        city = city.replace(/ /g, "+");
        console.log("City: " + city);
        var state = $("#state option:selected").val();
        console.log("State: " + state);
        var zip = $("#zip").val().trim();
        console.log("Zip: " + zip);
        // Build the query URL
        // Search parameters start after the q= and use either + or %20 to escape spaces
        var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=bars+near+${address},${city},${state}+${zip}`;
        console.log("QueryURL: " + queryURL);
    };
    $(".modal").removeClass("is-active");
    var embedMap = $("#embed-map");
    embedMap.attr("src", queryURL);
});

// Close modal using X in the corner
$(".modal-close").on("click", function() {
    $(".modal").removeClass("is-active");
});

// Close modal by being able to click on .modal-background to close the modal
$(".modal-background").on("click", function() {
    $(".modal").removeClass("is-active");
});

/*
FIXME:
    - how do we work around if a user DOES NOT want to search for bars?
        - will need to write code that it will stop the function if no input is listed
        - or add another button in the modal that simply just closes the modal (.removeClass("is-active"))
*/
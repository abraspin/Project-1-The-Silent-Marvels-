// This is the API key I set up through Google
var apiKey = "AIzaSyBXaAKr4axxaUBPZXJD-cKQF9qtHVrzXe0";
// Search parameters start after the q= and use either + or %20 to escape spaces
/* TODO:
    - assuming bars will stay as the main search parameter
        - do we want anything else listed?
    - near+ZIPCODE is one option but could also be an actual physical address
        - ex. near+123+Example+Street,Austin,TX+78701
*/
var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=bars+near+78626`; 
var embedMap = $("#embed-map");
embedMap.attr("src", queryURL);

/* Toggle modal on by adding class is-active
TODO:
    - would just have to add this wherever in the code makes sense for it to pop up
        - either at the beginning
        - or once their search is complete
*/
$(".modal").addClass("is-active");

// Event listener on the modal to close the modal (the button is not doing anything currently)
// $("#submit-button").on("click", function() {
//     event.preventDefault();
//     $(".modal").removeClass("is-active");
// });

// Select the user input for each field on the modal
$("#submit-button").on("click", function() {
    event.preventDefault();
    var zipOnly = $("#zip-only").val();
    console.log("ZIP Only: " + zipOnly);
    var address = $("#address").val();
    address = address.replace(/ /g, "+");
    console.log("Address: " + address);
    var city = $("#city").val();
    city = city.replace(/ /g, "+");
    console.log("City: " + city);
    var state = $("#state").val();
    console.log("State: " + state);
    var zip = $("#zip").val();
    console.log("Zip: " + zip);
    $(".modal").removeClass("is-active");
});


/* TODO:
    - add the code to select the user input in the modal
        - will probably need some if statements because it could either be zip only or address
        - if user inputs address will then also need to format properly for google query url (see line #8)
*/
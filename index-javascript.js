$(document).ready(function () {
  // clear the local storage cocktail object array on page load
  localStorage.setItem("potentialCocktailsObjectArray", "[]");

  // Clear the #ingredient-search field on page load
  $("#ingredient-search").val("");
});

//this will hold all previously searched ingredients
var searchedIngredientStrings = [];

//TODO: This event listener is not currently used, a future feature will allow users to remove a single ingredient from their existing search.
// $(".delete").on("click", function (event) {
//   removeIngredient(event.currentTarget.classList[1], localStorage.getItem("potentialCocktailsObjectArray"));
// });

// when the ingredient is submitted with "Enter key"
$("#ingredient-search-field").on("submit", function (event) {
  ingredientSearch(event);
});

//When the ingredient is submitted with the "Click search button"
$("#search-button").on("click", function (event) {
  ingredientSearch(event);
});

// This function runs the ajax call functions, renders the page, and updates ingredient lists.
// It is found in both the search submit event, and also the click search submit
function ingredientSearch(event) {
  event.preventDefault();
  // grab searched ingredient string from search field
  var searchedIngredient = $("#ingredient-search").val();
  //  use homemade capitalization function
  searchedIngredient = capitalize(searchedIngredient);
  // check to make sure it hasn't been searched yet this session, if so return early.
  if (searchedIngredientStrings.indexOf(searchedIngredient) >= 0) {
    return;
  }
  //  run cocktail API call and HTML render, returns false if API returns 404
  getCocktailIDs(searchedIngredient);
  $("#ingredient-search").val("");
  $("#reload-page-button").attr("style", "display: inline;");
}

// This function takes an ingredient string and queries the cocktailDB for an array of cocktail IDs.
// Then it checks those IDs against the existing array of cocktail objects in local storage (if it exists)
// For each ID returned by the query: If it finds the ID in the existing array, it increments that cocktail's internal counter
// If it doesn't find an ID in the existing array, it makes a new cocktail object and pushes it on.
// RETURNS: if the searched string returns 404 from API, this function returns false. Else returns true.
function getCocktailIDs(ingredientToSearch) {
  // build the query url - Single ingredient search endpoint
  queryURL = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${ingredientToSearch}`;
  // // Performing AJAX GET request
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    // After the data comes back from the API
    .then(function (response) {
      //Error check - if the ingredient is blank string or returns 404 from API, return early and render alert on page
      if (!response || !ingredientToSearch.trim()) {
        badIngredientSearch();
        return;
      }
      // add this ingredient to the page, and to an array to keep track
      $("#ingredient-list-element").append(
        `<div  class="control"><span class="tag is-link is-large">${ingredientToSearch}   </span>     </div>`
      );
      searchedIngredientStrings.push(ingredientToSearch);
      // Clear the #ingredient-search field

      // This array will hold the ID's of all the cocktails that contain this ingredient
      var thisIngredientCocktailsIDArray = [];
      // This array holds the COCKTAIL OBJECTS for all cocktails matching user-inputted ingredients so far
      var potentialCocktailsObjectArray = JSON.parse(localStorage.getItem("potentialCocktailsObjectArray")) || [];
      // We are expecting a large array of cocktails, each of which contains the searched ingredient as one of its ingredients
      var returnedDrinksArray = response.drinks;
      // loop through this array
      for (var i = 0; i < returnedDrinksArray.length; i++) {
        // Now for each drink in this array, we'll grab its id
        var idDrink = response.drinks[i].idDrink;
        // and push it onto the array holding this list's drinks' IDs
        thisIngredientCocktailsIDArray.push(idDrink);
      }
      // This checks to see if the potential cocktails ID array is empty (i.e. no ingredients have been searched yet)
      if (potentialCocktailsObjectArray.length === 0) {
        // Add each found cocktail ID to a new cocktail object and append to potentialCocktailsObject Array
        cocktailIDArrayToObjectArray(thisIngredientCocktailsIDArray, potentialCocktailsObjectArray);
      } else {
        // loop through the ID array we just built for this ingredient,  each ID check the "potential cocktails" Object Array and look for an object with this key.
        // If one is found, decrement numFound counter (it should find all of them)
        for (var i = 0; i < thisIngredientCocktailsIDArray.length; i++) {
          thisID = thisIngredientCocktailsIDArray[i];
          var IDFound = false;

          for (var j = 0; j < potentialCocktailsObjectArray.length; j++) {
            potentialID = potentialCocktailsObjectArray[j].cocktailID;

            if (thisID === potentialID) {
              potentialCocktailsObjectArray[j].numTimesSearched++;
              IDFound = true;
              break;
            }
          }
          if (!IDFound) {
            var cocktail = { cocktailID: thisID, numTimesSearched: 1 };
            potentialCocktailsObjectArray.push(cocktail);
          }
        }
      }
      // Now store somewhere we can check that object array on subsequent ingredient search
      localStorage.setItem("potentialCocktailsObjectArray", JSON.stringify(potentialCocktailsObjectArray));

      // sort cocktail array
      var sortedCocktailObjectArray = sortCocktailObjectArray("potentialCocktailsObjectArray");

      $("#cocktail-card-element").empty();
      for (var i = 0; i < 10; i++) {
        // get recipes  and render cocktail  cards
        getCocktailRecipesFromID(sortedCocktailObjectArray[i].cocktailID);
      }
      // if API call was successful
      return true;
    });
}
// FUNCTION - add an array of cocktail ID's to an array of cocktail objects
// to be used ONLY when no cocktailObjectArray exists in local storage
function cocktailIDArrayToObjectArray(cocktailIDArray, cocktailObjectArray) {
  //loop through cocktail ID array
  for (var i = 0; i < cocktailIDArray.length; i++) {
    // And create a new cocktail object, and push to the cocktail object array
    var cocktail = { cocktailID: cocktailIDArray[i], numTimesSearched: 1 };
    cocktailObjectArray.push(cocktail);
  }
}

///FUNCTION:  takes a recipe ID and returns an array containing the below 6 values:
// Index 0: cocktail name, 1: thumbnail URL, 2: ingredients with measurements array, 3: cocktail glass, 4: instructions
//Index 0, 3, 4 are strings. Index 1 is a URL. Index 2 is an array of strings.
function getCocktailRecipesFromID(cocktailID) {
  var queryURL = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailID}`;
  $.ajax({ url: queryURL, method: "GET" }).then(function (response) {
    //this contains all the cocktail details
    var drinkDetails = response.drinks[0];
    //GET cocktail name
    var cocktailName = drinkDetails.strDrink;
    //GET cocktail thumbnail Reference
    var cocktailThumbnailRef = drinkDetails.strDrinkThumb;
    ////GET ingredients list
    var ingredientListArray = [];
    for (var i = 1; i < 16; i++) {
      var key = `strIngredient${i}`;
      //check to make sure ingredient exists (else it's set to null)
      if (drinkDetails[key] != null) {
        ingredientListArray.push(drinkDetails[key]);
      }
    }
    ////GET ingredient measurements
    var ingredientMeasurementArray = [];
    for (var i = 1; i < 16; i++) {
      var key = `strMeasure${i}`;
      //don't check null, some measurements are null (ex. lemon wedge)
      ingredientMeasurementArray.push(drinkDetails[key]);
    }
    //BUILD array with Ingredient <-> measurement pairing in each element
    var ingredientsWithMeasuresArray = concatenateIngredientMeasures(ingredientListArray, ingredientMeasurementArray);
    // GET Glass type
    var cocktailGlassType = drinkDetails.strGlass;
    // GET instructions
    var cocktailInstructions = drinkDetails.strInstructions;
    // build recipe array
    var cocktailDetails = [
      cocktailName,
      cocktailThumbnailRef,
      ingredientsWithMeasuresArray,
      cocktailGlassType,
      cocktailInstructions,
    ];

    var cocktailName = cocktailDetails[0];
    var cocktailThumbRef = cocktailDetails[1];
    var cocktailIngredients = cocktailDetails[2];
    var cocktailGlass = cocktailDetails[3];
    var cocktailInstr = cocktailDetails[4];
    var ingredienthtml = "";
    // build ingredient list element
    for (var i = 0; i < cocktailIngredients.length; i++) {
      ingredienthtml += `<ul>${cocktailIngredients[i]}</ul>`;
    }
    // build cocktail recipe card element
    var newCocktailCardEl = $(`
    <div style='width: 300px' class="column is-narrow">
    <article class="message is-link">
        <div class="message-header">
            <p>${cocktailName}</p>
        </div>
        <div class="message-body">
            <div class="board-item">
                <div class="board-item-content"><a href="${cocktailThumbRef}" target="_blank"><img src="${cocktailThumbRef}" alt="cocktail-thumb" width="100"
                        height="150"></a> </div>
            </div>
            <div class="board-item">
                <div class="board-item-content"><span>${cocktailGlass}</span></div>
            </div>
            <br>
            <div id="ingredients-${cocktailName}"> ${ingredienthtml}</div>
            <br>
            <div class="board-item">
                <div class="board-item-content"><span>${cocktailInstr}</span></div>
            </div>
        </div>
    </article>
    </div>
          `);
    // render the card on the page
    $("#cocktail-card-element").append(newCocktailCardEl);
  });
}

//TODO: This function is not currently called anywhere, a future feature will allow users to remove a single ingredient from their existing search.
//FUNCTION - REMOVE INGREDIENT - This will re-run ajax call and remove it from "found recipes" or whatever
// ingredientstring: the ingredient to remove   ,   ingredientArray: array of pre-searched ingredients
function removeIngredient(ingredientString, ingredientArray) {
  // assuming this is inside of a click-event and is getting passed the ingredient string
  // Single ingredient search //
  queryURL = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${ingredientString}`;
  // // Performing AJAX GET request
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    // After the data comes back from the API
    .then(function (response) {
      // This array will hold the ID's of all the cocktails that contain this ingredient
      var thisIngredientCocktailsIDArray = [];
      // This array holds the COCKTAIL OBJECTS for all cocktails matching user-inputted ingredients so far
      var potentialCocktailsObjectArray = JSON.parse(localStorage.getItem("potentialCocktailsObjectArray")) || [];
      // We are expecting a large array of cocktails, each of which contains the searched ingredient as one of its ingredients
      var returnedDrinksArray = response.drinks;
      // loop through this array
      for (var i = 0; i < returnedDrinksArray.length; i++) {
        // Now for each drink in this array, we'll grab its id
        var idDrink = response.drinks[i].idDrink;
        // and push it onto the array holding this list's drinks' IDs
        thisIngredientCocktailsIDArray.push(idDrink);
      }
      // looping through the array we just built for this ingredient, and for each ID in the array
      // check the "potential cocktails" Object Array and look for an object with this key.
      // If one is found, decrement its numFound counter. (IT should find all of them!!)
      for (var i = 0; i < thisIngredientCocktailsIDArray.length; i++) {
        thisID = thisIngredientCocktailsIDArray[i];
        // var IDFound = false;
        for (var j = 0; j < potentialCocktailsObjectArray.length; j++) {
          potentialID = potentialCocktailsObjectArray[j].cocktailID;
          if (thisID === potentialID) {
            potentialCocktailsObjectArray[j].numTimesSearched--;
            //this break is so it will not iterate the rest of the array after it finds the ID it wants, which
            //should only appear once
            break;
          }
        }
      }
      //AT THE END we change the local storage array to now exclude this ingredient
      // localStorage.setItem("potentialCocktailsObjectArray", JSON.stringify(potentialCocktailsObjectArray));
    });
}

// FUNCTION - sort a cocktail object array from local storage, based on numTimesSearched counter
function sortCocktailObjectArray(localStorageKey) {
  // this is assuming there is an array in local storage with the name localStorageKey
  sortedCocktailArray = JSON.parse(localStorage.getItem(localStorageKey)) || [];
  sortedCocktailArray.sort((a, b) => (parseInt(b.numTimesSearched) > parseInt(a.numTimesSearched) ? 1 : -1));
  return sortedCocktailArray;
}

// FUNCTION:concatenates 2 string arrays into one string array. Used to combine strIngredient and strMeasurement values from API response.
function concatenateIngredientMeasures(ingredientArray, measurementsArray) {
  var ingredientsWithMeasuresArray = [];
  for (var i = 0; i < ingredientArray.length; i++) {
    if (measurementsArray[i]) {
      ingredientsWithMeasuresArray.push(`${ingredientArray[i]} - ${measurementsArray[i]}`);
    } else {
      ingredientsWithMeasuresArray.push(`${ingredientArray[i]}`);
    }
  }
  return ingredientsWithMeasuresArray;
}

// FUNCTION to capitalize the first letter of a string, to be used on searched ingredients.
// Returns passed-in string but with first character capitalized.
const capitalize = (str) => {
  if (typeof str === "string") {
    return str.replace(/^\w/, (c) => c.toUpperCase());
  } else {
    return "";
  }
};

//FUNCTION If a searched ingredient returns a 404 error from theCocktailDB API, this function briefly alerts user
// renders a message on the page, then removes it.
function badIngredientSearch() {
  var badSearchAlert = $(
    `<h4 class = "box has-text-dark has-background-danger has-text-centered subtitle is-6">Oops! The database didn't find any recipes containing that ingredient! <br> Please try another</h4>`
  );
  //append it
  $("#bad-search-alert-el").html(badSearchAlert);
  setTimeout(function () {
    // wait and then fade out and remove
    $("#bad-search-alert-el h4").fadeOut();
  }, 3000);
}

// Toggle modal active by using click listener on find-bar-button
$("#find-bar-button").on("click", function () {
  event.preventDefault();
  $(".modal").addClass("is-active");
});

// Close modal using X in the corner
$(".modal-close").on("click", function () {
  $(".modal").removeClass("is-active");
});

// Close modal by being able to click on .modal-background to close the modal
$(".modal-background").on("click", function () {
  $(".modal").removeClass("is-active");
});

// This is the Maps Embed API key I (Ryan) set up through Google
var apiKey = "AIzaSyBXaAKr4axxaUBPZXJD-cKQF9qtHVrzXe0";

// Select the user input for each field on the modal
$("#submit-button").on("click", function () {
  event.preventDefault();
  var searchFor = $('input[name="answer"]:checked').val();
  var zipOnly = $("#zip-only").val();
  if (zipOnly) {
    // Build the query URL
    // Search parameters start after the q= and use either + or %20 to escape spaces
    var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${searchFor}+near+${zipOnly}`;
  } else {
    var address = $("#address").val().trim();
    address = address.replace(/ /g, "+");
    var city = $("#city").val().trim();
    city = city.replace(/ /g, "+");
    var state = $("#state option:selected").val();
    var zip = $("#zip").val().trim();
    // Build the query URL
    // Search parameters start after the q= and use either + or %20 to escape spaces
    var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${searchFor}+near+${address},${city},${state}+${zip}`;
  }
  $(".modal").removeClass("is-active");
  var embedMap = $("#embed-map");
  embedMap.attr("src", queryURL);

  // Display map on page
  $("#map-section").attr("style", "");

  //scroll to the maps element on the page'
  $("html, body").animate({ scrollTop: $("#map-section").offset().top }, "fast");
});

// Click event on reload-page-button to reload page
$("#reload-page-button").on("click", function() {
  event.preventDefault();
  location.reload();
});
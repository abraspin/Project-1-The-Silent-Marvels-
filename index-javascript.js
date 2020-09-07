$(document).ready(function () {
  // clear the local storage cocktail object array on page load
  localStorage.setItem("potentialCocktailsObjectArray", "[]");

  // Clear the #ingredient-search field on page load

  $("#ingredient-search").val("");
});

//// variable declarations

//this will hold all previously searched ingredients
var searchedIngredientStrings = [];

$(".delete").on("click", function (event) {
  // console.log(event.currentTarget.classList[1]);
  removeIngredient(event.currentTarget.classList[1], localStorage.getItem("potentialCocktailsObjectArray"));
});

///////////////////////////// EVENT LISTENER FOR ADDING NEW INGREDIENTS/////////////////////////////

// when the ingredient is submitted with "Enter key"
$("#ingredient-search-field").on("submit", function (event) {
  ingredientSearch(event);
});

//When the ingredient is submitted with the "Click search button"
$("#search-button").on("click", function (event) {
  ingredientSearch(event);
});

//////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS///////
////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////This function runs the ajax call functions, renders the page, and updates ingredient lists.
// It is found in both the search submit event, and also the click search submit
function ingredientSearch(event) {
  event.preventDefault();
  console.log("hi");
  // grab searched ingredient string from search field
  var searchedIngredient = $("#ingredient-search").val();
  //  use homemade capitalization function
  searchedIngredient = capitalize(searchedIngredient);
  // check to make sure it hasn't been searched yet this session, if so return early.
  if (searchedIngredientStrings.indexOf(searchedIngredient) >= 0) {
    return;
  }
  //  run cocktail API call and HTML render
  getCocktailIDs(searchedIngredient);
  // add this string to the page, and to an array to keep trak
  $("#ingredient-list-element").append(
    `<div  class="control"><span class="tag is-link is-large">${searchedIngredient}  <button class="delete is-large" aria-label="delete"></button> </span>     </div>`
  );
  searchedIngredientStrings.push(searchedIngredient);

  // Clear the #ingredient-search field
  $("#ingredient-search").val("");
}

////////////////////////this function returns potentialCocktailsObjectArray
// This function takes an ingredient string and queries the docktailDB for an array of cocktail IDs.
// Then it checks those IDs against the existing array of cocktail objects in local storage (if it exists)
// For each ID returned by the query: If it finds the ID in the existing array, it increments that cocktail's internal counter
// If it doesn't find an ID in the existing array, it makes a new cocktail object and pushes it on.
//TODO: adding the rendering logic...cause of the freaking ajax timing!?!?
function getCocktailIDs(ingredientToSearch) {
  // build the query url
  // multi-ingredient filter//
  // queryURL = `https://www.thecocktaildb.com/api/json/v2/${advancedAPIKey}/filter.php?i=${ingredientToSearch}`

  // Single ingredient search //
  queryURL = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${ingredientToSearch}`;

  // // Performing AJAX GET request
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    // After the data comes back from the API
    .then(function (response) {
      // console.log("getCocktailIDs -> response", response);
      // This array will hold the ID's of all the cocktails that contain this ingredient

      // This array holds the ID's for all the cocktails matching the searched ingredient
      var thisIngredientCocktailsIDArray = [];

      // This array holds the COCKTAIL OBJECTS for all cocktails matching user-inputted ingredients so far
      var potentialCocktailsObjectArray = JSON.parse(localStorage.getItem("potentialCocktailsObjectArray")) || [];
      // console.log(potentialCocktailsObjectArray);

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
        // console.log("no previous cocktail object array found");

        // function that loops through thisIngredientCocktailsID Array and adds each to a new cocktail object
        // and appends to potentialCocktailsObject Array

        cocktailIDArrayToObjectArray(thisIngredientCocktailsIDArray, potentialCocktailsObjectArray);
        // console.log(potentialCocktailsObjectArray);
      } else {
        // looping through the array we just built for this ingredient, and for each ID in the array
        // check the "potential cocktails" Object Array and look for an object with this key.
        // If one is found, decrement numFound counter (it should find all of them)
        for (var i = 0; i < thisIngredientCocktailsIDArray.length; i++) {
          thisID = thisIngredientCocktailsIDArray[i];
          var IDFound = false;

          for (var j = 0; j < potentialCocktailsObjectArray.length; j++) {
            potentialID = potentialCocktailsObjectArray[j].cocktailID;

            if (thisID === potentialID) {
              // console.log("id found!");
              potentialCocktailsObjectArray[j].numTimesSearched++;
              IDFound = true;
              break;
            }
          }
          if (!IDFound) {
            // console.log("No ID Found");
            var cocktail = { cocktailID: thisID, numTimesSearched: 1 };
            potentialCocktailsObjectArray.push(cocktail);
          }
        }
      }
      //now we have an array containing the ID's of all the cocktails containing this ingredient
      // console.log(thisIngredientCocktailsIDArray);
      // console.log(potentialCocktailsObjectArray);
      // return potentialCocktailsObjectArray;

      // Now store somewhere we can check that object array on subsequent ingredient search
      localStorage.setItem("potentialCocktailsObjectArray", JSON.stringify(potentialCocktailsObjectArray));
      //   return potentialCocktailsObjectArray;

      ////////////////////////////////////RENDER THE PAGE///////////////////////////TODO: make this a function duh
      var sortedCocktailObjectArray = sortCocktailObjectArray("potentialCocktailsObjectArray");
      console.log("getCocktailIDs -> sortedCocktailObjectArray", sortedCocktailObjectArray);

      $("#cocktail-card-element").empty();
      for (var i = 0; i < 10; i++) {
        getCocktailRecipesFromID(sortedCocktailObjectArray[i].cocktailID);
      }
    });
}

///////////////FUNCTION - add an array of cocktail ID's to an array of cocktail objects
// to be used ONLY when no cocktailObjectArray exists in local storage
function cocktailIDArrayToObjectArray(cocktailIDArray, cocktailObjectArray) {
  //loop through cocktail ID array
  for (var i = 0; i < cocktailIDArray.length; i++) {
    // And create a new cocktail object, and push to the cocktail object array
    var cocktail = { cocktailID: cocktailIDArray[i], numTimesSearched: 1 };
    cocktailObjectArray.push(cocktail);
  }
}

///////////////FUNCTION:  takes a recipe ID and returns an array containing the below 6 values:
// Index 0: cocktail name, 1: thumbnail URL, 2: ingredients with measurements array, 3: cocktail glass, 4: instructions
//Index 0, 3, 4 are strings. Index 1 is a URL. Index 2 is an array of strings.
function getCocktailRecipesFromID(cocktailID) {
  var queryURL = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailID}`;
  // console.log("getCocktailRecipesFromID -> queryURL", queryURL);
  $.ajax({ url: queryURL, method: "GET" }).then(function (response) {
    console.log(response);

    //this contains all the cocktail details
    var drinkDetails = response.drinks[0];

    //GET cocktail name
    var cocktailName = drinkDetails.strDrink;
    // console.log(cocktailName);

    //GET cocktail thumbnail Reference
    var cocktailThumbnailRef = drinkDetails.strDrinkThumb;
    // console.log(cocktailThumbnailRef);

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
      //check to make sure ingredient exists (else it's set to null)
      // if (drinkDetails[key] != null) {
      ingredientMeasurementArray.push(drinkDetails[key]);
      // // console.log(drinkDetails[key]);
      // }
    }

    //BUILD array with Ingredient <-> measurement pairing in each element
    var ingredientsWithMeasuresArray = concatenateIngredientMeasures(ingredientListArray, ingredientMeasurementArray);
    console.log(ingredientsWithMeasuresArray);

    // GET Glass type
    var cocktailGlassType = drinkDetails.strGlass;
    // console.log(cocktailGlassType);

    // GET instructions
    var cocktailInstructions = drinkDetails.strInstructions;
    // console.log(cocktailInstructions);

    var cocktailDetails = [
      cocktailName,
      cocktailThumbnailRef,
      ingredientsWithMeasuresArray,
      cocktailGlassType,
      cocktailInstructions,
    ];
    // console.log("getCocktailRecipesFromID -> cocktailDetails", cocktailDetails);

    //this function returns an array containing the above 6 values. Index 0, 3, 4 are strings. Index 1 is a URL. Index 2 is an array of strings.
    // return cocktailDetails;

    // Actually I'm rendering the page right here...thanks to timing issues I think?

    var cocktailName = cocktailDetails[0];
    var cocktailThumbRef = cocktailDetails[1];
    var cocktailIngredients = cocktailDetails[2];
    var cocktailGlass = cocktailDetails[3];
    var cocktailInstr = cocktailDetails[4];
    var ingredienthtml = "";

    for (var i = 0; i < cocktailIngredients.length; i++) {
      ingredienthtml += `<ul>${cocktailIngredients[i]}</ul>`;
    }

    var newCocktailCardEl = $(`
    <div style='width: 300px' class="column is-narrow">
    <article class="message is-link">
        <div class="message-header">
            <p>${cocktailName}</p>
        </div>
        <div class="message-body">
            <div class="board-item">
                <div class="board-item-content"><img src="${cocktailThumbRef}" alt="cocktail-thumb" width="100"
                        height="150"> </div>
            </div>
            <div class="board-item">
                <div class="board-item-content"><span>${cocktailGlass}</span></div>
            </div>
            <div id="ingredients-${cocktailName}"> ${ingredienthtml}</div>
            <div class="board-item">
                <div class="board-item-content"><span>${cocktailInstr}</span></div>
            </div>
        </div>
    </article>
    </div>

          `);

    $("#cocktail-card-element").append(newCocktailCardEl);
  });
}

///////////////FUNCTION - REMOVE INGREDIENT - This will re-run ajax call and remove it from "found recipes" or whatever
// ingredientstring: the ingredient to remove   ,   ingredientArray: array of pre-searched ingredients
function removeIngredient(ingredientString, ingredientArray) {
  //assuming this is inside of a click-event and is getting passed the ingredient string

  //TODO: This could be made into a function bc I've now used nearly the same logic twice
  // Single ingredient search //
  queryURL = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${ingredientString}`;

  // // Performing AJAX GET request
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    // After the data comes back from the API
    .then(function (response) {
      // console.log("getCocktailIDs -> response", response);
      // This array will hold the ID's of all the cocktails that contain this ingredient
      var thisIngredientCocktailsIDArray = [];

      // This array holds the COCKTAIL OBJECTS for all cocktails matching user-inputted ingredients so far
      var potentialCocktailsObjectArray = JSON.parse(localStorage.getItem("potentialCocktailsObjectArray")) || [];
      // // console.log(ingredientArray)

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
        // // console.log("getCocktailIDs -> thisID", thisID)
        // // console.log("getCocktailIDs -> potentialCocktailsObjectArray", potentialCocktailsObjectArray)
        // var IDFound = false;

        for (var j = 0; j < potentialCocktailsObjectArray.length; j++) {
          potentialID = potentialCocktailsObjectArray[j].cocktailID;

          if (thisID === potentialID) {
            // console.log("id found!");
            potentialCocktailsObjectArray[j].numTimesSearched--;
            // IDFound = true

            //this break is so it will not iterate the rest of the array after it finds the ID it wants, which
            //should only appear once
            break;
          }
        }
      }
      //AT THE END we change the local storage array to now exclude this ingredient
      localStorage.setItem("potentialCocktailsObjectArray", JSON.stringify(potentialCocktailsObjectArray));
    });
}

///////////////FUNCTION - sort a cocktail object array from local storage, based on numTimesSearched counter
function sortCocktailObjectArray(localStorageKey) {
  // this is assuming there is an array in local storage with the name localStorageKey
  sortedCocktailArray = JSON.parse(localStorage.getItem(localStorageKey)) || [];

  sortedCocktailArray.sort((a, b) => (parseInt(b.numTimesSearched) > parseInt(a.numTimesSearched) ? 1 : -1));

  // console.log(sortedCocktailArray);
  return sortedCocktailArray;
}

////////////////FUNCTION:concatenates 2 arrays into string array
function concatenateIngredientMeasures(ingredientArray, measurementsArray) {
  // console.log("concatenateIngredientMeasures -> measurementsArray", measurementsArray);
  // console.log("concatenateIngredientMeasures -> ingredientArray", ingredientArray);
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

// function to capitalize the first letter of a string, to be used on searched ingredients.
// Returns passed-in string but with first character capitalized.
const capitalize = (str) => {
  if (typeof str === "string") {
    return str.replace(/^\w/, (c) => c.toUpperCase());
  } else {
    return "";
  }
};

///////////////////////////////////CODE FOR MAPS API FUNCTIONALITY AND MODAL////////////////////////

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
  console.log("Search for: " + searchFor);
  var zipOnly = $("#zip-only").val();
  if (zipOnly) {
    console.log("ZIP Only: " + zipOnly);
    // Build the query URL
    // Search parameters start after the q= and use either + or %20 to escape spaces
    var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${searchFor}+near+${zipOnly}`;
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
    var queryURL = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${searchFor}+near+${address},${city},${state}+${zip}`;
    console.log("QueryURL: " + queryURL);
  }
  $(".modal").removeClass("is-active");
  var embedMap = $("#embed-map");
  embedMap.attr("src", queryURL);

  // Display map on page
  $("#map-section").attr("style", "");
});

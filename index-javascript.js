$(document).ready(function () {
  localStorage.setItem("potentialCocktailsObjectArray", "[]");
});

// Example cocktail object
// var cocktail = {
//     numTimesSearched = # of times this recipe has been found by ingredient searches,
//    cocktailID: "cocktail name" }

//// variable declarations
//our upgraded Patreon API key (not actually necessary it turns out...oops!)
advancedAPIKey = "9973533";

///////////////////////////////TESTER CODE ///////////////////////////////////////////////////////////

// tester buttons for multiple ajax calls
$("#gin").on("click", function (event) {
  getCocktailIDs("gin");
});

$("#vodka").on("click", function (event) {
  getCocktailIDs("vodka");
});
$("#triple_sec").on("click", function (event) {
  getCocktailIDs("triple_sec");
});
$("#lemon_juice").on("click", function (event) {
  getCocktailIDs("lemon_juice");
});
$("#sort-object-array").on("click", function (event) {
  sortCocktailObjectArray("potentialCocktailsObjectArray");
});
$("#cocktail-id").on("click", function (event) {
  getCocktailRecipesFromID("14366");
});

$(".delete").on("click", function (event) {
  // console.log(event.currentTarget.classList[1]);
  removeIngredient(event.currentTarget.classList[1], localStorage.getItem("potentialCocktailsObjectArray"));
});

///////////////////////////// EVENT LISTENER FOR ADDING NEW INGREDIENTS/////////////////////////////
$("#ingredient-search-button").on("click", function (event) {
  event.preventDefault();
  var searchedIngredient = $("#ingredient-search").val();
  // console.log(searchedIngredient);
  getCocktailIDs(searchedIngredient);
  $("#ingredient-list-element").append(
    `<div class="control"><span class="tag is-link is-large">${searchedIngredient}</span></div>`
  );
  // Clear the #ingredient-search field
  $("#ingredient-search").val("");
});

//////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS//FUNCTIONS///////
////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////this function returns potentialCocktailsObjectArray
// This function takes an ingredient string and queries the docktailDB for an array of cocktail IDs.
// Then it checks those IDs against the existing array of cocktail objects in local storage (if it exists)
// For each ID returned by the query: If it finds the ID in the existing array, it increments that cocktail's internal counter
// If it doesn't find an ID in the existing array, it makes a new cocktail object and pushes it on.
//TODO: adding the rendering logic...cause of the freaking ajax timing!!!
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

      //FIXME: var thisIngredientCocktailsIDArray = JSON.parse(localStorage.getItem(potentialCocktailsObjectArray)) || []

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
        // and appeneds to potentialCocktailsObject Array
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
      for (var i = 0; i < 5; i++) {
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
    // console.log(response);

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
    // console.log(ingredientsWithMeasuresArray);

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

    var cocktailName = cocktailDetails[0];
    var cocktailThumbRef = cocktailDetails[1];
    var cocktailIngredients = cocktailDetails[2];
    var cocktailGlass = cocktailDetails[3];
    var cocktailInstr = cocktailDetails[4];

    var newCocktailCardEl = $(`
        <div style = 'width: 300px' class="column is-narrow">
              <article class="message is-link">
                  <div class="message-header">
                      <p>${cocktailName}</p>
                      <button class="delete" aria-label="delete"></button>
                  </div>
                  <div class="message-body">
                      <div class="board-item">
                          <div class="board-item-content"><img src="${cocktailThumbRef}" alt="cocktail-thumb" width="100" height="150"> </div>
                      </div>
                      <div class="board-item">
                          <div class="board-item-content"><span>${cocktailGlass}</span></div>
                      </div>
                      <div class="board-item">
                      <div class="board-item-content"><span>${cocktailInstr}</span></div>
                  </div>
                  </div>
              </article>
          </div>
          `);

    //TODO: Can't figure out how to get this UL to dynamically get itself looped into the inside of the card
    for (var i = 0; i < cocktailIngredients.length; i++) {
      newCocktailCardEl.append($(`<ul>${cocktailIngredients[i]}</ul>`));
    }

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
  // sortedCocktailArray.sort((a, b) => b.cocktailID.localeCompare(a.cocktailID));
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

////OBSOLETE////////////FUNCTION: for checking if a cocktail ingredients list is a complete subset of ingredients-on-hand///////////////////
// function arrayContainsArray(superset, subset) {
//     // console.log("arrayContainsArray -> subset", subset)
//     // console.log("arrayContainsArray -> superset", superset)
//     if (subset.length === 0) {
//         return false;
//     }
//     return subset.every(function (value) {
//         return (superset.indexOf(value) >= 0);
//     });
// }

function renderCocktailCard(name, thumbnailRef, ingredArray, glass, instructions) {
  // $(".container").append(` `)
}

document
    .getElementById("checkButton")
    .addEventListener("click", checkRecipes);

async function checkRecipes() {

    const results = document.getElementById("results");
    results.innerHTML = "Checking...";

    // Load recipes.json
    const response = await fetch("recipes.json");
    const recipes = await response.json();

    // Get current tab
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    // Execute code inside the webpage
    const inventoryResult = await chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },

        func: () => {
            const inventory = {};
            document.querySelectorAll(".web-bank-action-item").forEach(item => {
                    inventory[item.dataset.itemName] = Number(item.dataset.maxQuantity);
                });

            return inventory;
        }
    });

    const inventory = inventoryResult[0].result;
    const craftable = [];

    for (const recipe of recipes) {
        let maxCraftable = Infinity;

        for (const ingredient in recipe.ingredients) {
            const required = recipe.ingredients[ingredient];
            const owned = inventory[ingredient] || 0;

            maxCraftable = Math.min(
                maxCraftable,
                Math.floor(owned / required)
            );
        }

        if (maxCraftable > 0) {
            craftable.push({
                id: recipe.id,
                name: recipe.name,
                amount: maxCraftable,
                value: recipe.value,
                ingredients: recipe.ingredients
            });

        }
    }

    displayRecipes(craftable);
}

function displayRecipes(recipes) {

    const results = document.getElementById("results");

    results.innerHTML = "";

    if (recipes.length === 0) {

        results.innerHTML =
            "<p>No recipes can currently be crafted.</p>";

        return;
    }

    recipes.sort((a, b) => b.amount - a.amount);

    for (const recipe of recipes) {
        let value = recipe.amount * recipe.value;

        const div = document.createElement("div");
        div.className = "recipe";
        div.innerHTML = `
            <h3>${recipe.name}</h3>
            <div class="container">
                <div class="icon-container">
                    <img class="img" src="img/${recipe.id}.png" alt="${recipe.name} Icon">
                    <div class="circle"></div>
                    <div class="temp">${recipe.amount}</div>
                </div>


                <div class="amount">
                    Value: ${value}

                    <details class="ingredients-dropdown">
                        <summary>View Ingredients</summary>
                        <br>

                        <ul>
                            ${Object.entries(recipe.ingredients)
                                .map(([name, qty]) => `<li>${qty * recipe.amount}x ${name}</li>`)
                                .join("")}
                        </ul>
                    </details>


                </div>
            </div>
        `;

        results.appendChild(div);
    }
}
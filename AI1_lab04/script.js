import { API_KEY } from "./secret.js";

window.onload = function () {

    let CSVreq = new XMLHttpRequest()
    CSVreq.open("GET", "./miasta.csv", false);
    CSVreq.send(null);

    let cities = CSVreq.responseText.split("\n")
        .map(x => x.trim()
            .replace(/,$/, ""));
    //console.log(cities);

    const input = document.getElementById("city-input");
    const suggestions = document.getElementById("suggestions");

    let selectedSuggestionIndex = -1;

    input.addEventListener("input", () => {
        const query = input.value.toLowerCase();

        selectedSuggestionIndex = -1;

        if (!query.length) {
            suggestions.style.display = "none";
            suggestions.innerHTML = "";
            return;
        }

        const startsWith = cities.filter(city  =>
            city.toLowerCase().startsWith(query)
        );

        const contains = cities.filter(city => {
            const c = city.toLowerCase();
            return c.includes(query) && !c.startsWith(query);
        });

        // ustawia wyniki sugesti w kolejności elementy [zaczynajace sie z] => [zawierajace]
        const filtered = [...startsWith, ...contains].slice(0, 10);

        suggestions.innerHTML = "";

        if (filtered.length === 0) {
            suggestions.style.display = "none";
            return;
        }

        filtered.forEach(city => {
            const div = document.createElement("div");
            div.textContent = city;

            div.addEventListener("click", () => {
                input.value = city;
                suggestions.style.display = "none";
            });

            suggestions.appendChild(div);
        });

        suggestions.style.display = "block";
    });


    const searchForm = document.getElementById("search-form");
    searchForm.addEventListener("submit", (eventSubmit) => {
        eventSubmit.preventDefault();

        const query = input.value;
        if (query.length === 0) {
            return;
        }
        console.log(query);

        const parent = document.getElementById("weatherContainer");
        parent.innerHTML = '';

        fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);

                data.forEach(city => { // limit = 1 więc tylko 1 miasto

                let req = new XMLHttpRequest();
                req.open("GET", `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&lang=pl&units=metric&appid=${API_KEY}`, true);
                req.addEventListener("load", function (event) {
                    let resT = JSON.parse(req.responseText);
                    console.log(resT);

                    const weatherBox = document.getElementById("weather-box-template");

                    const node = weatherBox.cloneNode(true);
                    node.hidden = false;

                    const iconsContainer = node.querySelector('[data-role="iconsContainer"]');
                    const desc = node.querySelector('[data-role="desc-text"]');
                    const name = node.querySelector('[data-role="name-text"]');
                    const temp = node.querySelector('[data-role="temp-text"]');
                    const tempFeel = node.querySelector('[data-role="temp-feel-text"]');
                    const clouds = node.querySelector('[data-role="clouds-text"]');
                    const humidity = node.querySelector('[data-role="humidity-text"]');
                    const wind = node.querySelector('[data-role="wind-text"]');
                    const pressure = node.querySelector('[data-role="pressure-text"]');

                    resT.weather.forEach(item => {
                        const iconPlace = document.createElement("img");
                        iconPlace.alt = "weatherImage";
                        iconPlace.src = `https://openweathermap.org/img/wn/${item.icon}@2x.png`;
                        iconsContainer.appendChild(iconPlace);
                    });

                    const description = resT.weather.map(w => w.description).join(", ");
                    desc.textContent = capitalize(description);

                    name.textContent = resT.name;
                    temp.textContent = "Temperatura: " + resT.main.temp + "°C";
                    tempFeel.textContent = "Odczuwalna: " + resT.main.feels_like + "°C";
                    clouds.textContent = "Zachmurzenie: " + resT.clouds.all + "%";
                    humidity.textContent = "Wilgotność: " + resT.main.humidity + "%";
                    wind.textContent = "Prędkość wiatru: " + resT.wind.speed + " m/s";
                    pressure.textContent = "Ciśnienie: " + resT.main.pressure + " hPa";

                    const parent = document.getElementById("weatherContainer");
                    parent.appendChild(node);
                });
                req.send(null);


                fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${city.lat}&lon=${city.lon}&lang=pl&units=metric&appid=${API_KEY}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);

                        const forecastParent = document.getElementById("forecastContainer");
                        forecastParent.innerHTML = "";

                        forecastParent.addEventListener(
                            "wheel",
                            (e) => {
                                e.preventDefault();
                                forecastParent.scrollLeft += e.deltaY * 1.1;
                            },
                            { passive: false } // konieczne, żeby preventDefault zadziałało na chrome
                        );

                        data.list.forEach(entry => {

                            const dateTime = entry.dt_txt;
                            const temp = entry.main.temp;
                            const tempFeels = entry.main.feels_like;
                            const icon = entry.weather[0].icon;
                            const desc = entry.weather.map(w => w.description).join(", ");

                            const dateObj = new Date(dateTime);
                            const dayName = dateObj.toLocaleDateString("pl-PL", {
                                weekday: "short"
                            });
                            const hour = dateObj.getHours().toString().padStart(2, "0");

                            const card = document.createElement("div");
                            card.classList.add("forecast-card");

                            const dayEl = document.createElement("div");
                            dayEl.classList.add("day");
                            dayEl.textContent = `${dayName} ${hour}:00`;

                            const imgEl = document.createElement("img");
                            imgEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
                            imgEl.alt = "weather icon";

                            const tempEl = document.createElement("div");
                            tempEl.classList.add("temp");
                            tempEl.textContent = "Temp.: " + temp + "°C";

                            const tempFeelEl = document.createElement("div");
                            tempFeelEl.classList.add("tempFeel");
                            tempFeelEl.textContent = "Czuć: " + tempFeels +"°C";

                            const descEl = document.createElement("div");
                            descEl.classList.add("desc");
                            descEl.textContent = capitalize(desc);

                            card.appendChild(dayEl);
                            card.appendChild(imgEl);
                            card.appendChild(tempEl);
                            card.appendChild(tempFeelEl);
                            card.appendChild(descEl);

                            forecastParent.appendChild(card);
                        });
                    });

                });
            });

    });

    // obsługa strzałek i entera w sugestiach
    input.addEventListener("keydown", (e) => {
        const items = suggestions.querySelectorAll("div");
        const length = items.length;

        if (length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex + 1) % length;
                updateSuggestionHighlight();
                scrollToActiveSuggestion();
                break;

            case "ArrowUp":
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex - 1 + length) % length;
                updateSuggestionHighlight();
                scrollToActiveSuggestion();
                break;

            case "Enter":
                if (selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    input.value = items[selectedSuggestionIndex].textContent.trim();
                    suggestions.style.display = "none";
                    selectedSuggestionIndex = -1;
                }
                break;

            case "Escape":
                suggestions.style.display = "none";
                selectedSuggestionIndex = -1;
                break;
        }
    });

    function updateSuggestionHighlight() {
        const items = suggestions.querySelectorAll("div");

        items.forEach((item, i) => {
            if (i === selectedSuggestionIndex) item.classList.add("suggestion-active");
            else item.classList.remove("suggestion-active");
        });
    }

    function scrollToActiveSuggestion() {
        const items = suggestions.querySelectorAll("div");
        if (items.length === 0 || selectedSuggestionIndex < 0) return;

        const active = items[selectedSuggestionIndex];
        const containerTop = suggestions.scrollTop;
        const containerBottom = containerTop + suggestions.clientHeight;

        const itemTop = active.offsetTop;
        const itemBottom = itemTop + active.offsetHeight;

        if (itemTop < containerTop)
            suggestions.scrollTop = itemTop - 4;

        else if (itemBottom > containerBottom)
            suggestions.scrollTop = itemBottom - suggestions.clientHeight + 4;
    }

    function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

}
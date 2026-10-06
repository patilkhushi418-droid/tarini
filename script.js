/* =========================================================
   TARINI
   JavaScript
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let cyberCells = [];

let userLatitude = null;
let userLongitude = null;

let cyberMap = null;

let userMarker = null;
let cellMarker = null;
let routeLine = null;


/* =========================================================
   LOAD CYBER CELLS
========================================================= */

async function loadCyberCells() {

    try {

        const response =
            await fetch("./cyberCells.json");


        if (!response.ok) {

            throw new Error(
                "Could not load cyberCells.json"
            );

        }


        cyberCells =
            await response.json();


        console.log(
            "Cyber cells loaded:",
            cyberCells
        );


    } catch (error) {

        console.error(
            "Cyber cell loading error:",
            error
        );


        const locationStatus =
            document.getElementById(
                "locationStatus"
            );


        if (locationStatus) {

            locationStatus.innerHTML = `
                <strong>
                    Unable to load cyber cell data.
                </strong>
                <br>
                Please make sure cyberCells.json is
                in the same folder as index.html.
            `;

        }

    }

}


/* =========================================================
   FIND MY LOCATION
========================================================= */

function findMyLocation() {

    const locationStatus =
        document.getElementById(
            "locationStatus"
        );


    const button =
        document.getElementById(
            "findLocationButton"
        );


    if (!navigator.geolocation) {

        locationStatus.textContent =
            "Your browser does not support location access.";

        return;

    }


    if (cyberCells.length === 0) {

        locationStatus.innerHTML = `
            <strong>
                Cyber cell data is not ready yet.
            </strong>
            <br>
            Please wait a moment and try again.
        `;

        return;

    }


    locationStatus.innerHTML = `
        <strong>
            Finding your location...
        </strong>
        <br>
        Please allow location access when your browser asks.
    `;


    button.disabled = true;

    button.textContent =
        "Finding...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            userLatitude =
                position.coords.latitude;

            userLongitude =
                position.coords.longitude;


            locationStatus.innerHTML = `
                <strong>
                    Location found.
                </strong>
                <br>
                Finding the nearest cyber crime cell...
            `;


            findNearestCyberCell();


            button.disabled = false;

            button.textContent =
                "Find Again";

        },


        function (error) {

            console.error(
                "Location error:",
                error
            );


            if (error.code === 1) {

                locationStatus.innerHTML = `
                    <strong>
                        Location permission was denied.
                    </strong>
                    <br>
                    Please allow location access in your
                    browser settings and try again.
                `;

            } else {

                locationStatus.textContent =
                    "Unable to find your location. Please try again.";

            }


            button.disabled = false;

            button.textContent =
                "Find My Location";

        },


        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}


/* =========================================================
   FIND NEAREST CYBER CELL
========================================================= */

function findNearestCyberCell() {

    let nearestCell = null;

    let shortestDistance =
        Infinity;


    cyberCells.forEach(
        function (cell) {

            const distance =
                calculateDistance(
                    userLatitude,
                    userLongitude,
                    cell.latitude,
                    cell.longitude
                );


            if (distance < shortestDistance) {

                shortestDistance =
                    distance;

                nearestCell =
                    cell;

            }

        }
    );


    if (!nearestCell) {

        document.getElementById(
            "locationStatus"
        ).textContent =
            "No cyber crime cell was found.";

        return;

    }


    displayNearestCell(
        nearestCell,
        shortestDistance
    );


    createMap(
        nearestCell
    );

}


/* =========================================================
   HAVERSINE DISTANCE
========================================================= */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371;


    const latitudeDifference =
        toRadians(
            lat2 - lat1
        );


    const longitudeDifference =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(
            latitudeDifference / 2
        ) *
        Math.sin(
            latitudeDifference / 2
        ) +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(
            longitudeDifference / 2
        ) *

        Math.sin(
            longitudeDifference / 2
        );


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


function toRadians(degrees) {

    return degrees *
        (Math.PI / 180);

}


/* =========================================================
   DISPLAY ONLY NEAREST CELL
========================================================= */

function displayNearestCell(
    cell,
    distance
) {

    const nearestCell =
        document.getElementById(
            "nearestCell"
        );


    const locationStatus =
        document.getElementById(
            "locationStatus"
        );


    locationStatus.innerHTML = `
        <strong>
            Nearest cyber cell found.
        </strong>
        <br>
        Showing only the closest available centre.
    `;


    nearestCell.style.display =
        "block";


    nearestCell.innerHTML = `

        <div class="nearest-label">
            NEAREST CYBER CRIME CELL
        </div>


        <div class="nearest-content">

            <div>

                <h3>
                    ${escapeHTML(cell.name)}
                </h3>


                <p>
                    ${escapeHTML(cell.address)}
                </p>


                <p>
                    ${escapeHTML(cell.city)},
                    ${escapeHTML(cell.state)}
                </p>


                <div class="cell-actions">

                    <a
                        href="tel:${cell.phone}"
                        class="call-btn"
                    >
                        Call ${escapeHTML(cell.displayPhone)}
                    </a>


                    <a
                        href="https://www.google.com/maps/dir/?api=1&origin=${userLatitude},${userLongitude}&destination=${cell.latitude},${cell.longitude}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="direction-btn"
                    >
                        Open in Google Maps →
                    </a>

                </div>

            </div>


            <div
                id="nearestDistance"
                class="nearest-distance"
            >
                ${distance.toFixed(1)} km away
            </div>

        </div>

    `;

}


/* =========================================================
   CREATE MAP
========================================================= */

async function createMap(cell) {

    const mapContainer =
        document.getElementById(
            "mapContainer"
        );


    mapContainer.style.display =
        "block";


    /*
       Create map only once.
    */

    if (!cyberMap) {

        cyberMap =
            L.map("cyberMap");


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(
            cyberMap
        );

    }


    /*
       Remove previous markers.
    */

    if (userMarker) {

        cyberMap.removeLayer(
            userMarker
        );

    }


    if (cellMarker) {

        cyberMap.removeLayer(
            cellMarker
        );

    }


    if (routeLine) {

        cyberMap.removeLayer(
            routeLine
        );

    }


    /*
       USER LOCATION
    */

    userMarker =
        L.marker([
            userLatitude,
            userLongitude
        ])
        .addTo(cyberMap)
        .bindPopup(
            "<strong>Your location</strong>"
        );


    /*
       CYBER CELL LOCATION
    */

    cellMarker =
        L.marker([
            cell.latitude,
            cell.longitude
        ])
        .addTo(cyberMap)
        .bindPopup(
            `<strong>${escapeHTML(cell.name)}</strong>`
        );


    /*
       GET ACTUAL ROAD ROUTE
       Using OSRM routing service.
    */

    try {

        const routeURL =
            "https://router.project-osrm.org/route/v1/driving/" +

            `${userLongitude},${userLatitude};` +

            `${cell.longitude},${cell.latitude}` +

            "?overview=full&geometries=geojson";


        const response =
            await fetch(
                routeURL
            );


        if (!response.ok) {

            throw new Error(
                "Route could not be calculated."
            );

        }


        const data =
            await response.json();


        if (
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error(
                "No route found."
            );

        }


        const route =
            data.routes[0];


        /*
           OSRM coordinates are:

           [longitude, latitude]

           Leaflet requires:

           [latitude, longitude]
        */

        const routeCoordinates =
            route.geometry.coordinates.map(
                function (coordinate) {

                    return [
                        coordinate[1],
                        coordinate[0]
                    ];

                }
            );


        /*
           Draw route.
        */

        routeLine =
            L.polyline(
                routeCoordinates,
                {
                    color:
                        "#7c3aed",

                    weight:
                        6,

                    opacity:
                        0.8
                }
            ).addTo(
                cyberMap
            );


        /*
           Road distance.
        */

        const roadDistance =
            route.distance / 1000;


        document.getElementById(
            "routeDistance"
        ).textContent =
            `${roadDistance.toFixed(1)} km by road`;


        document.getElementById(
            "nearestDistance"
        ).textContent =
            `${roadDistance.toFixed(1)} km by road`;


        /*
           Fit map to entire route.
        */

        cyberMap.fitBounds(
            routeLine.getBounds(),
            {
                padding:
                    [40, 40]
            }
        );


    } catch (error) {

        console.error(
            "Route error:",
            error
        );


        /*
           If routing fails,
           still show both locations.
        */

        const bounds =
            L.latLngBounds(
                [
                    userLatitude,
                    userLongitude
                ],
                [
                    cell.latitude,
                    cell.longitude
                ]
            );


        cyberMap.fitBounds(
            bounds,
            {
                padding:
                    [50, 50]
            }
        );


        document.getElementById(
            "routeDistance"
        ).textContent =
            "Route unavailable";

    }


    /*
       Fix Leaflet display after
       hidden container becomes visible.
    */

    setTimeout(
        function () {

            cyberMap.invalidateSize();

        },
        300
    );


    /*
       Bring user to the map.
    */

    setTimeout(
        function () {

            mapContainer.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });

        },
        400
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


/* =========================================================
   CHATBOT
========================================================= */

function sendMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );


    const message =
        input.value.trim();


    if (!message) {

        return;

    }


    addChatMessage(
        message,
        "user"
    );


    input.value =
        "";


    setTimeout(
        function () {

            const response =
                generateResponse(
                    message
                );


            addChatMessage(
                response,
                "bot"
            );

        },
        500
    );

}


/* =========================================================
   ADD CHAT MESSAGE
========================================================= */

function addChatMessage(
    message,
    sender
) {

    const chatMessages =
        document.getElementById(
            "chatMessages"
        );


    const messageDiv =
        document.createElement(
            "div"
        );


    messageDiv.className =
        sender === "user"
            ? "message user-message"
            : "message bot-message";


    messageDiv.innerHTML = `

        <div class="message-avatar">
            ${sender === "user" ? "You" : "T"}
        </div>

        <div class="message-bubble">
            ${escapeHTML(message)}
        </div>

    `;


    chatMessages.appendChild(
        messageDiv
    );


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/* =========================================================
   CHATBOT RESPONSES
========================================================= */

function generateResponse(message) {

    const text =
        message.toLowerCase();


    /*
       BLACKMAIL
    */

    if (
        text.includes("blackmail") ||
        text.includes("threatening")
    ) {

        return `
            Do not pay or send more photos or videos.
            Take screenshots of the threats, save the username,
            phone number and profile URL, and do not delete the chats.
            If you are in immediate danger, call 112.
            For cybercrime, you can also contact 1930.
        `;

    }


    /*
       PHOTO / IMAGE
    */

    if (
        text.includes("photo") ||
        text.includes("image") ||
        text.includes("morphed") ||
        text.includes("deepfake")
    ) {

        return `
            Take screenshots of the post or profile.
            Save the username, profile URL and date/time.
            Keep the original photo if you have it.
            Report the content and preserve the evidence.
        `;

    }


    /*
       FAKE PROFILE
    */

    if (
        text.includes("fake profile") ||
        text.includes("fake account") ||
        text.includes("impersonat")
    ) {

        return `
            Screenshot the fake profile and save its URL.
            Keep the username and any messages sent from it.
            Report the account for impersonation and preserve
            the evidence.
        `;

    }


    /*
       HARASSMENT
    */

    if (
        text.includes("harass") ||
        text.includes("abuse") ||
        text.includes("stalk")
    ) {

        return `
            Save screenshots of the messages, calls and profiles.
            Keep usernames, phone numbers and dates as evidence.
            Do not retaliate. If you feel unsafe, call 112.
        `;

    }


    /*
       FRAUD
    */

    if (
        text.includes("fraud") ||
        text.includes("scam") ||
        text.includes("money") ||
        text.includes("payment")
    ) {

        return `
            Save your transaction ID, payment screenshots and
            related messages. Do not share your OTP, PIN or password.
            If money was lost through cyber fraud, contact 1930
            as quickly as possible.
        `;

    }


    /*
       HACKED / PASSWORD
    */

    if (
        text.includes("otp") ||
        text.includes("password") ||
        text.includes("hacked") ||
        text.includes("account")
    ) {

        return `
            Change your password from a trusted device.
            Enable two-factor authentication and log out of
            unknown sessions. Never share OTPs or recovery codes.
        `;

    }


    /*
       DEFAULT
    */

    return `
        Tell me a little more about what happened.
        You can mention blackmail, photo misuse, a fake profile,
        harassment, fraud or a threat, and I will help you
        understand the next steps.
    `;

}


/* =========================================================
   ENTER KEY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCyberCells();


        const chatInput =
            document.getElementById(
                "chatInput"
            );


        if (chatInput) {

            chatInput.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter"
                    ) {

                        sendMessage();

                    }

                }
            );

        }

    }
);
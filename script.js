// Initialize the map using Leaflet.js
let filterOptions;

const initializeMap = () => {
    const map = L.map("map", {
        center: [50.0, 8.25], // مرکز نقشه
        zoom: 12,             // سطح زوم اولیه
        maxZoom: 19,          // حداکثر سطح زوم
        minZoom: 5,           // حداقل سطح زوم (اختیاری)
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
    }).addTo(map);

    return map;
};

const map = initializeMap();

// Define color scale for Unsicherheits-Score
const colorScale = d3
    .scaleLinear()
    .domain([0, 0.5, 1]) // Input range
    .range(["#ff0000", "#ffff00", "#00ff00"]); // Output colors (Red, Yellow, Green)

const filterShow = document.getElementById("filters");
const modal = document.getElementById("shap-modal");
const overlay = document.getElementById("modal-overlay");
// Global variables
let filteredData = [];
let classType = null;
let currentClassType = null
let activeFilters = [];
let originalData = [];

// Fetch accident data from the JSON file
const fetchAccidentData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load data");

        const data = await response.json();
        if (!data || data.length === 0) {
            console.warn("No data available");
            return [];
        }
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
};

// Initialize data and map
(async () => {
    originalData = await fetchAccidentData("data/accident_data.json");
    if (originalData.length > 0) {
        populateFilterOptions(originalData);
        updateMap(originalData, currentClassType);
    }
})();

// Function to extract unique values for each filter category

function populateFilterOptions(data) {
    filterOptions = {
        jahr: [...new Set(data.map((item) => item.Jahr))]
            .filter((item) => item != null)
            .sort(),
        // month: [...new Set(data.map((item) => item.Monat))].filter(item => item != null).sort(),
        monat: [...new Set(data.map((item) => item.Monat))]
            .filter(Boolean)
            .sort((a, b) => a - b),

        istRad: [...new Set(data.map((item) => item.IstRad))]
            .filter((item) => item != null)
            .sort(),
        istPkw: [...new Set(data.map((item) => item.IstPKW))]
            .filter((item) => item != null)
            .sort(),
        istFuss: [...new Set(data.map((item) => item.IstFuss))]
            .filter((item) => item != null)
            .sort(),
        istKrad: [...new Set(data.map((item) => item.IstKrad))]
            .filter((item) => item != null)
            .sort(),
        istSonstig: [...new Set(data.map((item) => item.IstSonstig))]
            .filter((item) => item != null)
            .sort(),
        stunde: [...new Set(data.map((item) => item.Stunde))]
            .filter((item) => item != null)
            .sort(),
        unfallart: [...new Set(data.map((item) => item.Unfallart))]
            .filter((item) => item != null)
            .sort(),
        unfalltyp: [...new Set(data.map((item) => item.Unfalltyp))]
            .filter((item) => item != null)
            .sort(),
        lichtverhältnisse: [
            ...new Set(data.map((item) => item.Lichtverhältnisse)),
        ]
            .filter((item) => item != null)
            .sort(),
        straßenverhältnisse: [
            ...new Set(data.map((item) => item.Straßenverhältnisse)),
        ]
            .filter((item) => item != null)
            .sort(),
        straßenart: [...new Set(data.map((item) => item.Straßenart))]
            .filter((item) => item != null)
            .sort(),
        stadtteil: [...new Set(data.map((item) => item.Stadtteil))]
            .filter((item) => item != null)
            .sort(),
        unfallklasse : [0, 1, 2],
        tagkategorie : [...new Set(data.map((item) => item.TagKategorie))]
        .filter((item) => item != null)
        .sort(),
    };

    const filterCategoryDropdown = document.getElementById("filter-category");
    filterCategoryDropdown.innerHTML = `
        <option value="" selected>Liste der Filter</option>
        <option value="jahr">Jahr</option>
        <option value="monat">Monat</option>
        <option value="tagkategorie">TagKategorie</option>
        <option value="unfallklasse">Unfallklasse</option>
        <option value="istRad">Ist Rad</option>
        <option value="istPkw">Ist PKW</option>
        <option value="istFuss">Ist Fuss</option>
        <option value="istKrad">Ist Krad</option>
        <option value="istSonstig">Ist Sonstige</option>
        <option value="stunde">Stunde</option>
        <option value="unfallart">Unfallart</option>
        <option value="unfalltyp">Unfalltyp</option>
        <option value="lichtverhältnisse">Lichtverhältnisse</option>
        <option value="straßenverhältnisse">Straßenverhältnisse</option>
        <option value="straßenart">Straßenart</option>
        <option value="stadtteil">Stadtteil</option>
    `;
}

// Helper function to convert month numbers to names
function getMonthName(monat) {
    const monats = [
        "Januar", 
        "Februar", 
        "März", 
        "April", 
        "Mai", 
        "Juni", 
        "Juli", 
        "August", 
        "September", 
        "Oktober", 
        "November", 
        "Dezember",
    ];
    return monats[monat - 1] || monat;
}
function getUnfallartName(unfallart) {
    const unfallarts = {
        '1' : 'Zusammenstoß mit anfahrendem/anhaltendem/ruhendem Fahrzeug',
        '2' : 'Zusammenstoß mit vorausfahrendem/wartendem Fahrzeug',
        '3' : 'Zusammenstoß mit seitlich in gleicher Richtung fahrendem Fahrzeug',
        '4' : 'Zusammenstoß mit entgegenkommendem Fahrzeug',
        '5' : 'Zusammenstoß mit einbiegendem/kreuzendem Fahrzeug',
        '6' : 'Zusammenstoß zwischen Fahrzeug und Fußgänger',
        '7' : 'Aufprall auf Fahrbahnhindernis',
        '8' : 'Abkommen von Fahrbahn nach rechts',
        '9' : 'Abkommen von Fahrbahn nach links',
        '0' : 'Unfall anderer Art',
    };
    return unfallarts[unfallart] || unfallart;
}
function getUnfallklasseName(unfallklasse) {
    const unfallklasses = {
        0 : 'Unfall mit Getöteten',
        1 : 'Unfall mit Schwerverletzten',
        2 : 'Unfall mit Leichtverletzten',
    };
    return unfallklasses[unfallklasse] || unfallklasse;
}

function getUnfaltypeName(unfalltyp){
    const unfalltyps = {
        '1' : 'Fahrunfall',
        '2' : 'Abbiegeunfall',
        '3' : 'Einbiegen oder Kreuzen-Unfall',
        '4' : 'Überschreiten-Unfall',
        '5' : 'Unfall durch ruhenden Verkehr',
        '6' : 'Unfall im Längsverkehr',
        '7' : 'Sonstiger Unfall',
    }
    return unfalltyps[unfalltyp] || unfalltyp;
}
function getisGroupName(isgroup){
    const groups = {
        '0' : 'Nein',
        '1' : 'Ja',
    }
    return groups[isgroup] || isgroup;
}
function getLichtName(light){
    const lights = {
        '0' : 'Tageslicht',
        '1' : 'Dämmerung',
        '2' : 'Dunkelheit',
    }
    return lights[light] || light;
}
function getStrasseVerhaeltniseName(street){
    const streets = {
        '0' : 'trocken',
        '1' : 'nass/feucht/schlüpfrig',
        '2' : 'winterglatt',
    }
    return streets[street] || street;
}
function getTagKategorieName(tagValue){
    const tags = {
        '0' : 'Wochenende',
        '1' : 'WochenTag',
    }
    return tags[tagValue] || tagValue;
}
// Add a new filter
document
    .getElementById("filter-category")
    .addEventListener("change", (event) => {
        const category = event.target.value;
        const filterValueDropdown = document.getElementById("filter-value");
        // پاک کردن مقادیر قبلی
        filterValueDropdown.innerHTML =
            '<option value="" disabled selected>Bitte wählen Sie einen Wert aus</option>';

        if (category && filterOptions[category]) {
            let values = filterOptions[category];

            // مرتب‌سازی ماه‌ها به ترتیب از 1 تا 12
            if (category === "monat") {
                values = values.sort((a, b) => a - b);
            }
            if (category === "stunde") {
                values = values.sort((a, b) => a - b);
            }
            const categoryFunctions = {
                'monat': getMonthName,
                'unfallart': getUnfallartName,
                'unfallklasse': getUnfallklasseName,
                'unfalltyp': getUnfaltypeName,
                'istRad' : getisGroupName,
                'istPkw' : getisGroupName,
                'istFuss' : getisGroupName,
                'istKrad' : getisGroupName,
                'istSonstig' : getisGroupName,
                'lichtverhältnisse' : getLichtName,
                'straßenverhältnisse' : getStrasseVerhaeltniseName,
                'tagkategorie' : getTagKategorieName,
            };

            // پر کردن مقادیر
            values.forEach((value) => {
                const option = document.createElement("option");
                option.value = value.toString();
                const transformFunction = categoryFunctions[category];
                option.textContent = transformFunction
                    ? transformFunction(value)
                    : value;
                filterValueDropdown.appendChild(option);
            });
        }
    });

document.getElementById("add-filter").addEventListener("click", () => {
    const category = document.getElementById("filter-category").value;
    const value = document.getElementById("filter-value").value;

    if (!category || !value) {
        alert("Bitte wählen Sie sowohl einen Filter als auch einen Wert aus, bevor Sie fortfahren.");
        return;
    }

    const existingFilter = activeFilters.find(
        (filter) => filter.category === category
    );
    if (existingFilter) {
        if (!existingFilter.values.includes(value)) {
            existingFilter.values.push(value);
        }
    } else {
        activeFilters.push({ category, values: [value] });
    }

    updateActiveFiltersUI();
    applyFiltersWithUncertainty();
});

document.querySelectorAll(".floating-panel").forEach((panel) => {
    panel.classList.add("open"); // اضافه کردن کلاس open به تمام پنل‌ها
});

const debouncedApplyFiltersWithUncertainty = debounce(
    applyFiltersWithUncertainty,
    300
);

document.getElementById("low-threshold").addEventListener("input", () => {
    const lowValue = document.getElementById("low-threshold").value;
    document.getElementById("low-threshold-value").textContent = `${lowValue}%`;
    debouncedApplyFiltersWithUncertainty();
});

document.getElementById("high-threshold").addEventListener("input", () => {
    const highValue = document.getElementById("high-threshold").value;
    document.getElementById(
        "high-threshold-value"
    ).textContent = `${highValue}%`;
    debouncedApplyFiltersWithUncertainty();
});

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.getElementById("toggle-wahr").addEventListener("change", (event) => {
    if (event.target.checked) {
        currentClassType = "wahr";
        document.getElementById("toggle-bestimmt").checked = false;
        document.getElementById("safety-settings").style.display = "none";
        document.getElementById('map-farbe').style.display = "block";
        filterShow.style.display = "block";
        createColorLegend();
        applyFiltersWithUncertainty();
    }
});

document
    .getElementById("toggle-bestimmt")
    .addEventListener("change", (event) => {
        if (event.target.checked) {
            currentClassType = "bestimmt";
            document.getElementById("toggle-wahr").checked = false;
            document.getElementById("safety-settings").style.display = "block";
            document.getElementById('map-farbe').style.display = "none";
            filterShow.style.display = "block";
            applyFiltersWithUncertainty();
        }
    });

document.getElementById(
    "filtered-count"
).textContent = `Total Points: ${filteredData.length}`;

function filterByUncertainty(data) {
    const lowThreshold =
        parseFloat(document.getElementById("low-threshold").value) / 100;
    const highThreshold =
        parseFloat(document.getElementById("high-threshold").value) / 100;

    return data.filter((item) => {
        const uncertainty = parseFloat(item["Unsicherheits-Score"]);
        return (
            !isNaN(uncertainty) &&
            uncertainty >= lowThreshold &&
            uncertainty < highThreshold
        ); // اصلاح بازه
    });
}

// function getColorForSicherheit(score) {
//     let red,
//         green,
//         blue = 0;

//     if (score <= 0.5) {
//         // از سبز به زرد
//         red = Math.round(255 * (score / 0.5)); // از 0 به 255
//         green = 255;
//     } else {
//         // از زرد به قرمز
//         red = 255;
//         green = Math.round(255 * ((1 - score) / 0.5)); // از 255 به 0
//     }

//     return `rgb(${red}, ${green}, ${blue})`;
// }
// تابع جدید برای اختصاص رنگ بر اساس مقیاس D3

function getColorForSicherheit(score, isCorrect) {
    const minUnsicherheit = 0.289547519; // حداقل مقدار Unsicherheit
    const maxUnsicherheit = 0.9924692;  // حداکثر مقدار Unsicherheit

    // نرمال‌سازی مقادیر به بازه [0, 1]
    const normalizedScore = (score - minUnsicherheit) / (maxUnsicherheit - minUnsicherheit);

    const colorScale = d3.scaleSequential()
        .domain([0, 1]) // دامنه داده‌ها پس از نرمال‌سازی
        .interpolator(d3.interpolateMagma); // استفاده از مقیاس رنگی Magma

    const reverseScore = 1 - normalizedScore; // معکوس کردن مقدار برای رنگ‌های مناسب
    const baseColor = colorScale(reverseScore); // تولید رنگ براساس normalizedScore

    // در صورت اشتباه بودن پیش‌بینی، کمی تیره‌تر می‌کنیم
    return isCorrect ? baseColor : lightenDarkenColor(baseColor, -15);
}

// تابع تغییر روشنایی رنگ برای اشتباه بودن پیش‌بینی
function lightenDarkenColor(hex, percent) {
    let num = parseInt(hex.slice(1), 16),
        r = (num >> 16) + percent,
        g = ((num >> 8) & 0x00FF) + percent,
        b = (num & 0x0000FF) + percent;

    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;

    return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}



function applyFiltersWithUncertainty() {
    if (!currentClassType) {
        filteredData = [];
        updateMap(filteredData, currentClassType);
        document.getElementById(
            "filtered-count"
        ).textContent = `Total Points: 0`;
        return;
    }
    // گام 1: فیلتر کردن براساس نوع کلاس (wahr یا bestimmt)
    let filteredDataByClass = originalData.filter(
        (item) =>
            item[
                `Unfallklasse ${
                    currentClassType.charAt(0).toUpperCase() +
                    currentClassType.slice(1)
                }`
            ] !== null
    );

    // گام 2: اعمال فیلترهای Unsicherheits-Score فقط در حالت bestimmt
    if (currentClassType === "bestimmt") {
        const lowThreshold =
            parseFloat(document.getElementById("low-threshold").value) / 100;
        const highThreshold =
            parseFloat(document.getElementById("high-threshold").value) / 100;

        filteredDataByClass = filteredDataByClass.filter((item) => {
            const uncertainty = parseFloat(item["Unsicherheits-Score"]);
            return (
                !isNaN(uncertainty) &&
                uncertainty >= lowThreshold &&
                uncertainty < highThreshold
            );
        });
    }

    // گام 3: اعمال فیلترهای پویا
    const filterMapping = {
        jahr: "Jahr",
        monat: "Monat",
        istRad: "IstRad",
        istPkw: "IstPKW",
        istFuss: "IstFuss",
        istKrad: "IstKrad",
        istSonstig: "IstSonstig",
        stunde: "Stunde",
        unfallart: "Unfallart",
        unfalltyp: "Unfalltyp",
        lichtverhältnisse: "Lichtverhältnisse",
        straßenverhältnisse: "Straßenverhältnisse",
        straßenart: "Straßenart",
        stadtteil: "Stadtteil",
        unfallklasse: 'Unfallklasse Wahr',
        unfallklasseb: 'Unfallklasse Bestimmt',
        tagkategorie: 'TagKategorie'
    };
    let dataKey
    activeFilters.forEach((filter) => {
        if (filter.category === 'unfallklasse') {
            if (currentClassType === 'wahr') {
                dataKey = filterMapping[filter.category];
            } else if (currentClassType === 'bestimmt') {
                dataKey = filterMapping['unfallklasseb']
            }
        } else {
            dataKey = filterMapping[filter.category];
        }
        if (!dataKey) {
            console.warn(`No mapping found for category: ${filter.category}`);
            return;
        }

        filteredDataByClass = filteredDataByClass.filter((item) => {
            const value = item[dataKey];
            if (value === null || value === undefined) {
                console.log(
                    `Skipping item due to missing value in category: ${dataKey}`
                );
                return false;
            }

            const stringValue = value.toString();
            const isMatch = filter.values.includes(stringValue);
            return isMatch;
        });
    });

    // گام 4: ذخیره و به‌روزرسانی نقشه
    filteredData = filteredDataByClass;
    updateMap(filteredData, currentClassType);

    // نمایش تعداد نقاط فیلتر شده
    document.getElementById(
        "filtered-count"
    ).textContent = `Gesamtpunkte: (${currentClassType}): ${filteredData.length}`;
}

// function updateMap(filteredData, classType) {
//     // حذف تمام لایه‌های موجود
//     map.eachLayer((layer) => {
//         if (!layer._url) {
//             map.removeLayer(layer);
//         }
//     });

//     // افزودن لایه جدید OpenStreetMap
//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//         attribution: "© OpenStreetMap contributors",
//         maxZoom: 18,
//     }).addTo(map);

//     // پیمایش داده‌های فیلتر شده
//     filteredData.forEach((item) => {
//         const latLng = [item.Latitude, item.Longitude];
//         // console.log("Processing item:", item);

//         if (classType === "wahr") {
//             // در حالت wahr، نمایش دایره‌های ساده
//             const classValue = item["Unfallklasse Wahr"];
//             const color = mapSeverityToColor(classValue, classType);

//             const marker = L.circleMarker(latLng, {
//                 radius: 10,
//                 color: color,
//                 fillColor: color,
//                 fillOpacity: 0.9,
//             });
            


//             marker.bindTooltip(
//                 `
//                 <div style="font-size: 14px; line-height: 1.4;">
//                     <strong>Position:</strong> (${item.Latitude.toFixed(4)}, ${item.Longitude.toFixed(4)})<br>
//                     <strong>Jahr:</strong> ${item.Jahr || "N/A"}<br>
//                     <strong>Monat:</strong> ${getMonthName(item.Monat) || "N/A"}<br>
//                     <strong>TagKategorie:</strong> ${getTagKategorieName(item.TagKategorie.toString()) || "N/A"}<br>
//                     <strong>Zeit:</strong> ${item.Stunde || "N/A"}:00 Uhr<br>
//                     <strong>Schweregrad:</strong> ${getUnfallklasseName(item["Unfallklasse Wahr"])}<br>
//                 </div>
//                 `,
//                 { permanent: false, direction: "top" }
//             );
            

//             marker.addTo(map);
//         } else if (classType === "bestimmt") {
//             // در حالت bestimmt، نمایش مقادیر با بازه رنگی
//             const wahrValue = item["Unfallklasse Wahr"];
//             const bestimmtValue = item["Unfallklasse Bestimmt"];
//             const isCorrect = wahrValue === bestimmtValue;

//             const sicherheitScore = parseFloat(item["Unsicherheits-Score"]);
//             const color = getColorForSicherheit(sicherheitScore, isCorrect);

//             const marker = L.divIcon({
//                 className: "custom-icon",
//                 html: `
//                     <div class="custom-marker" 
//                         style="
//                             --bg-color: ${color};
//                             --text-color: ${item["Unsicherheits-Score"] < 0.5 ? 'black' : 'white'};
//                             border: 2px solid ${isCorrect ? '#00FF00' : '#FF0000'};
//                             font-size: 14px;
//                             font-weight: bold;
//                             text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
//                         ">
//                         ${isCorrect ? "+" : "-"}
//                     </div>
//                 `,
//                 iconSize: [28, 28],
//                 iconAnchor: [14, 14],
//             });
            
            
                
            

//             const mapMarker = L.marker(latLng, { icon: marker });
//             const class0Prob =
//                 safeParseFloat(item["Wahrscheinlichkeit Klasse 0"]) / 100;
//             const class1Prob =
//                 safeParseFloat(item["Wahrscheinlichkeit Klasse 1"]) / 100;
//             const class2Prob =
//                 safeParseFloat(item["Wahrscheinlichkeit Klasse 2"]) / 100;

//             // Bind Tooltip for Hover
//             mapMarker.bindTooltip(
//                 `
//                 <strong>Jahr:</strong> ${item.Jahr}<br>
//                 <strong>Monat:</strong> ${item.Monat}<br>
//                 <strong>Wahr:</strong> ${wahrValue}<br>
//                 <strong>Bestimmt:</strong> ${bestimmtValue}<br>
//                 <strong>Unsicherheits:</strong> ${sicherheitScore.toFixed(2)}<br>
//                 <strong>Treffer:</strong> ${isCorrect ? "Korrekt" : "InKorrekt"}
//                 <br>
//                 <div style="font-size: 12px; width: 280px;">
//                     <div>
//                         <strong>Klasse 0:</strong>
//                         <div class='hover-bestimmt' style="
//                             display: inline-block; 
//                             background-color: ${getGrayShade(class0Prob)};
//                             height: 10px; 
//                             width: ${class0Prob * 100}%; 
//                             max-width: 100%; 
//                             border-radius: 3px;">
//                         </div> ${Math.round(class0Prob * 100)}%
//                         <br>
//                         <strong>Klasse 1:</strong>
//                         <div class='hover-bestimmt' style="
//                             display: inline-block; 
//                             background-color: ${getGrayShade(class1Prob)};
//                             height: 10px; 
//                             width: ${class1Prob * 100}%; 
//                             max-width: 100%; 
//                             border-radius: 3px;">
//                         </div> ${Math.round(class1Prob * 100)}%
//                         <br>
//                         <strong>Klasse 2:</strong>
//                         <div class='hover-bestimmt' style="
//                             display: inline-block; 
//                             background-color: ${getGrayShade(class2Prob)};
//                             height: 10px; 
//                             width: ${class2Prob * 100}%; 
//                             max-width: 100%; 
//                             border-radius: 3px;">
//                         </div> ${Math.round(class2Prob * 100)}%
//                     </div>
//                 </div>
//                 `,
//                 { permanent: false, direction: "top" }
//             );

//             mapMarker.on("click", () => {
//                 // استخراج SHAP Values برای همه کلاس‌ها
//                 const shapValuesClass0 = extractSHAPValues(item, 0).shapValues;
//                 const shapValuesClass1 = extractSHAPValues(item, 1).shapValues;
//                 const shapValuesClass2 = extractSHAPValues(item, 2).shapValues;

//                 // باز کردن مودال
//                 showSHAPModal(item);

//                 // اطمینان از آماده بودن DOM قبل از رسم نمودار
//                 const checkContainer = setInterval(() => {
//                     const container = document.getElementById(
//                         "shap-chart-container"
//                     );
//                     if (container) {
//                         clearInterval(checkContainer); // متوقف کردن بررسی

//                         // رسم نمودار برای همه کلاس‌ها در مودال
//                         renderGroupedSHAPGraph(
//                             shapValuesClass0,
//                             shapValuesClass1,
//                             shapValuesClass2,
//                             "shap-chart-container"
//                         );
//                     }
//                 }, 50); // بررسی هر 50 میلی‌ثانیه برای آماده بودن DOM
//             });

//             mapMarker.addTo(map);
//         }
//     });
// }
function updateMap(filteredData, classType) {
    // حذف تمام لایه‌های موجود
    map.eachLayer((layer) => {
        if (!layer._url) {
            map.removeLayer(layer);
        }
    });

    // افزودن لایه جدید OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
    }).addTo(map);

    if (!filteredData || filteredData.length === 0) {
        console.log("هیچ داده‌ای برای نمایش وجود ندارد.");
        return; // از ادامه اجرا جلوگیری می‌کند
    }

    // ایجاد گروه خوشه‌بندی
    const markers = L.markerClusterGroup({
        disableClusteringAtZoom: 18,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 40, // شعاع خوشه
        spiderfyOnMaxZoom: true, // نمایش نقاط به صورت مجزا در بیشترین زوم
        maxZoom: 19, // تنظیم حداکثر زوم
        iconCreateFunction: function (cluster) {
            const count = cluster.getChildCount();
            const size = count < 10 ? 30 : count < 50 ? 40 : 50; // تنظیم اندازه خوشه
            const color = count > 50 ? "red" : count > 20 ? "orange" : "green";

            return L.divIcon({
                html: `<div style="
                        background-color: ${color};
                        width: ${size}px;
                        height: ${size}px;
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: white;
                        font-size: 14px;
                        font-weight: bold;">${count}</div>`,
                className: "custom-cluster-icon",
                iconSize: [size, size],
            });
        },
    });

    // پیمایش داده‌های فیلتر شده
    if (classType === null) {
        filteredData = [];
    }
    filteredData.forEach((item) => {
        const latLng = [item.Latitude, item.Longitude];
        const marker = createMarker(latLng, item, classType);
        markers.addLayer(marker);
    });
    map.addLayer(markers);
}

function createColorLegend() {
    const legendWidth = 300;
    const legendHeight = 20;

    const legendContainer = document.getElementById("color-legend");
    legendContainer.innerHTML = "";

    // تعریف مقیاس رنگی Magma معکوس
    const colorScale = d3.scaleSequential((t) => d3.interpolateMagma(1 - t)).domain([0, 1]);

    // ایجاد SVG برای نمایش گرادیانت
    const svg = d3
        .select("#color-legend")
        .append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight + 20);

    // تعریف گرادیانت
    const defs = svg.append("defs");
    const gradient = defs
        .append("linearGradient")
        .attr("id", "magma-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // ایجاد استاپ‌های گرادیانت براساس مقیاس Magma معکوس
    const stops = 10; // تعداد تقسیمات رنگ
    for (let i = 0; i <= stops; i++) {
        const offset = (i / stops) * 100;
        const color = colorScale(i / stops);
        gradient.append("stop")
            .attr("offset", `${offset}%`)
            .attr("stop-color", color);
    }

    // اضافه کردن مستطیل برای نمایش گرادیانت
    svg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#magma-gradient)");

    // اضافه کردن برچسب‌های توضیحی
    svg.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 15)
        .text("0 (Niedrig)")
        .style("font-size", "12px")
        .style("fill", "#333");

    svg.append("text")
        .attr("x", legendWidth / 2 - 26)
        .attr("y", legendHeight + 15)
        .text("0.5 (Mittel)")
        .style("font-size", "12px")
        .style("fill", "#333");

    svg.append("text")
        .attr("x", legendWidth - 48)
        .attr("y", legendHeight + 15)
        .text("1 (Hoch)")
        .style("font-size", "12px")
        .style("fill", "#333");
}


function updateActiveFiltersUI() {
    const activeFiltersList = document.getElementById("active-filters");
    activeFiltersList.innerHTML = "";

    if (activeFilters.length === 0) {
        activeFiltersList.innerHTML = "<p>Keine aktiven Filter.</p>";
        return;
    }

    activeFilters.forEach((filter, filterIndex) => {
        const categoryContainer = document.createElement("div");
        categoryContainer.className = "filter-category-container";

        const categoryHeader = document.createElement("strong");
        categoryHeader.textContent = `${filter.category.toUpperCase()}: `;
        categoryContainer.appendChild(categoryHeader);

        filter.values.forEach((value, valueIndex) => {
            const valueItem = document.createElement("span");
            valueItem.className = "filter-value-item";
            valueItem.textContent = value;

            const removeButton = document.createElement("button");
            removeButton.textContent = "✕";
            removeButton.className = "remove-value-button";

            removeButton.addEventListener("click", () => {
                // حذف مقدار از فیلتر
                filter.values.splice(valueIndex, 1);

                if (filter.values.length === 0) {
                    // اگر هیچ مقداری باقی نماند، کل دسته فیلتر حذف شود
                    activeFilters.splice(filterIndex, 1);
                }

                // به‌روزرسانی UI و اعمال مجدد فیلترها
                updateActiveFiltersUI();
                applyFiltersWithUncertainty();
            });

            valueItem.appendChild(removeButton);
            categoryContainer.appendChild(valueItem);
        });

        activeFiltersList.appendChild(categoryContainer);
    });
}

// Function to map severity to colors
function mapSeverityToColor(classValue, classType) {
    if (classType === "wahr") {
        switch (classValue) {
            case 0:
                return "#D70000"; // Fatal (deep red)
            case 1:
                return "#FF8C00"; // Severe (dark orange)
            case 2:
                return "#FFF700"; // Light (golden yellow)
            default:
                return "#606060"; // Default (dark gray)
        }
    }
}

function extractSHAPValues(item, klasse) {
    const shapPrefix = `SHAP_${klasse}_`;
    const baseValueKey = `Base-Value Klasse ${klasse}`;

    const shapValues = Object.keys(item)
        .filter((key) => key.startsWith(shapPrefix))
        .map((key) => ({
            feature: key.replace(shapPrefix, ""),
            value: item[key],
        }));

    const baseValue = item[baseValueKey];
    return { shapValues, baseValue };
}

function renderGroupedSHAPGraph(
    shapValuesClass0,
    shapValuesClass1,
    shapValuesClass2,
    containerId
) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; // پاک کردن محتوای قبلی

    const margin = { top: 30, right: 20, bottom: 100, left: 100 };
    const width =
        container.getBoundingClientRect().width - margin.left - margin.right;
    const height = 400;

    // آماده‌سازی داده‌ها
    const features = shapValuesClass0.map((d) => d.feature);
    const data = features.map((feature, index) => ({
        feature,
        class0: shapValuesClass0[index]?.value || 0,
        class1: shapValuesClass1[index]?.value || 0,
        class2: shapValuesClass2[index]?.value || 0,
    }));


    // مقیاس‌ها
    const x0 = d3
        .scaleBand()
        .domain(data.map((d) => d.feature))
        .range([0, width])
        .padding(0.3);
    const x1 = d3
        .scaleBand()
        .domain(["class0", "class1", "class2"])
        .range([0, x0.bandwidth()])
        .padding(0.02);

    const y = d3
        .scaleLinear()
        .domain([
            d3.min(data, (d) => Math.min(d.class0, d.class1, d.class2)) * 1.2, // افزودن offset به مقادیر منفی
            d3.max(data, (d) => Math.max(d.class0, d.class1, d.class2)) * 1.2, // افزودن offset به مقادیر مثبت
        ])
        .nice()
        .range([height, 0]);

    const color = d3
        .scaleOrdinal()
        .domain(["class0", "class1", "class2"])
        .range(["#D70000", "#FF8C00", "#FFF700"]);

    // رسم SVG
    const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // افزودن خطوط راهنما به محور Y
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

    // افزودن گروه‌ها برای هر ویژگی
    const bars = svg
        .selectAll("g.bar-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", (d) => `translate(${x0(d.feature)}, 0)`);

    const tooltip = d3
        .select("body") // اتصال Tooltip به body
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("display", "none")
        .style("z-index", "1001"); // بزرگتر از مدال

    bars.selectAll("rect")
        .data((d) =>
            ["class0", "class1", "class2"].map((key) => ({
                key,
                value: d[key],
                feature: d.feature,
            }))
        )
        .enter()
        .append("rect")
        .attr("x", (d) => x1(d.key))
        .attr("y", (d) => y(Math.max(0, d.value)))
        .attr("width", x1.bandwidth())
        .attr("height", (d) => Math.max(3, Math.abs(y(d.value) - y(0))))
        .attr("fill", (d) => color(d.key))
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block").html(`
                <strong>Merkmal:</strong> ${d.feature}<br>
                <strong>Klasse:</strong> ${d.key}<br>
                <strong>Werte:</strong> ${d.value.toFixed(2)}
            `);
        })
        .on("mousemove", (event) => {
            tooltip
                .style("top", `${event.pageY - 30}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x0).tickSize(0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // افزودن محور Y
    svg.append("g").call(d3.axisLeft(y));

    // افزودن عنوان محور X و Y
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${width / 2}, ${height + 80})`)
        .style("font-size", "14px")
        .text("Merkmale");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90) translate(${-height / 2}, -60)`)
        .style("font-size", "14px")
        .text("SHAP Werte");

    // افزودن Legend
    const legend = svg
        .selectAll(".legend")
        .data(["Klasse 0 (Base Value: 19.432)", "Klasse 1 (Base Value: 33.223)", "Klasse 2 (Base Value: 47.344)"])
        .enter()
        .append("g")
        .attr(
            "transform",
            (d, i) => `translate(${600}, ${-30 + i * 30})` // تغییر Y برای نمایش زیر هم
        );

    legend
        .append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", (d, i) => color(`class${i}`));
    legend
        .append("text")
        .attr("x", 25)
        .attr("y", 13)
        // .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .text((d) => d);
}

// Call the function after the page loads
document.addEventListener("DOMContentLoaded", () => {
    createColorLegend();

    const closeModalButton = document.querySelector(".close");

    // بررسی وجود عناصر در DOM
    if (!modal || !overlay || !closeModalButton) {
        console.error("Modal, overlay, or close button not found in the DOM");
        return;
    }
    // بستن مدال با کلیک روی دکمه close
    closeModalButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeModal();
    });

    // بستن مدال با کلیک روی overlay
    overlay.addEventListener("click", closeModal);

    // بستن مدال با کلید Escape
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    });

    // نمایش مدال برای مثال
    window.showSHAPModal = () => openModal();
});

// نمایش Modal و نمودار
function showSHAPModal(item) {
    // استخراج SHAP برای هر کلاس
    const shapValuesClass0 = extractSHAPValues(item, 0).shapValues;
    const shapValuesClass1 = extractSHAPValues(item, 1).shapValues;
    const shapValuesClass2 = extractSHAPValues(item, 2).shapValues;

    console.log("SHAP Values Class 0:", shapValuesClass0);
    console.log("SHAP Values Class 1:", shapValuesClass1);
    console.log("SHAP Values Class 2:", shapValuesClass2);

    // نمایش Overlay و Modal
    overlay.style.display = "block";
    modal.style.display = "block";

    // رندر نمودار در Modal
    renderGroupedSHAPGraph(
        shapValuesClass0,
        shapValuesClass1,
        shapValuesClass2,
        "shap-chart-container"
    );
}

// بستن Modal
document.getElementById("modal-close").onclick = () => {
    overlay.style.display = "none";
    modal.style.display = "none";
};

// بستن Modal با کلیک روی Overlay
overlay.onclick = () => {
    overlay.style.display = "none";
    modal.style.display = "none";
};

function extractSHAPValuesForAllClasses(item) {
    const classes = [0, 1, 2];
    const allSHAPValues = classes.map((klasse) => {
        const shapPrefix = `SHAP_${klasse}_`;
        const baseValueKey = `Base-Value Klasse ${klasse}`;

        const shapValues = Object.keys(item)
            .filter((key) => key.startsWith(shapPrefix))
            .map((key) => ({
                feature: key.replace(shapPrefix, ""),
                value: item[key],
            }));

        const baseValue = item[baseValueKey];

        return { klasse: `Class ${klasse}`, baseValue, shapValues };
    });

    return allSHAPValues;
}

const closeModalButton = document.querySelector(".close");
if (closeModalButton) {
    closeModalButton.onclick = () => {
        if (modal) modal.style.display = "none";
    };
}

// بستن Modal با کلیک خارج از محتوای Modal
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

function getGrayShade(probability) {
    if (isNaN(probability) || probability < 0 || probability > 1) {
        return "rgb(200, 200, 200)"; // پیش‌فرض برای مقادیر نامعتبر
    }
    // تشدید کنتراست: تنظیم محدوده روشنایی
    const adjustedProbability = Math.pow(probability, 0.5); // تابعی برای افزایش کنتراست
    const intensity = Math.round(255 * (1 - adjustedProbability)); 
    return `rgb(${intensity}, ${intensity}, ${intensity})`;
}

function safeParseFloat(value) {
    if (value === undefined || value === null || value === "") {
        return 0; // مقدار پیش‌فرض در صورت نبود داده
    }
    return parseFloat(value.toString().replace(",", ".")) || 0; // جلوگیری از خطا در تبدیل
} // مقادیر احتمالات کلاس‌ها

function openModal() {
    modal.style.display = "block";
    overlay.style.display = "block";
}

// تابع بستن مدال
function closeModal() {
    modal.style.display = "none";
    overlay.style.display = "none";
}


function getRadiusBySeverity(classValue) {
    switch (classValue) {
        case 0:
            return 10; // Fatal - بزرگ‌تر
        case 1:
            return 8; // Severe - متوسط
        case 2:
            return 6; // Light - کوچک‌تر
        default:
            return 5;
    }
}

function mapSeverityToBorderColor(classValue) {
    switch (classValue) {
        case 0:
            return "#800000"; // تیره‌تر برای قرمز
        case 1:
            return "#CC8400"; // تیره‌تر برای نارنجی
        case 2:
            return "#CCCC00"; // تیره‌تر برای زرد
        default:
            return "#666666"; // خاکستری برای پیش‌فرض
    }
}

// تابع برای ایجاد نقاط
function createMarker(latLng, item, classType) {
    let marker;
    if (classType === "wahr") {
        const classValue = item["Unfallklasse Wahr"];
        const color = mapSeverityToColor(classValue, classType);
        marker = L.circleMarker(latLng, {
            radius: 10,
            color: color,
            fillColor: color,
            fillOpacity: 0.9,
        });
    } else if (classType === "bestimmt") {
        const wahrValue = item["Unfallklasse Wahr"];
        const bestimmtValue = item["Unfallklasse Bestimmt"];
        const isCorrect = wahrValue === bestimmtValue;
        const sicherheitScore = parseFloat(item["Unsicherheits-Score"]);
        const color = getColorForSicherheit(sicherheitScore, isCorrect);
        marker = L.marker(latLng, {
            icon: L.divIcon({
                className: "custom-icon",
                html: `<div class="custom-marker" style="
                    --bg-color: ${color};
                    border: 2px solid ${isCorrect ? "#00FF00" : "#FF0000"};
                    font-size: 14px;
                    font-weight: bold;">
                </div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            }),
        });
    }
    if (classType){
        marker.bindTooltip(generateTooltip(item, classType), {permanent: false, direction: "top" });
        marker.on("click", () => {
            // استخراج SHAP Values برای همه کلاس‌ها
            const shapValuesClass0 = extractSHAPValues(item, 0).shapValues;
            const shapValuesClass1 = extractSHAPValues(item, 1).shapValues;
            const shapValuesClass2 = extractSHAPValues(item, 2).shapValues;
            
            // باز کردن مودال
            showSHAPModal(item);
            
            // اطمینان از آماده بودن DOM قبل از رسم نمودار
            const checkContainer = setInterval(() => {
                const container = document.getElementById(
                "shap-chart-container"
                );
                if (container) {
                    clearInterval(checkContainer); // متوقف کردن بررسی
                    
                    // رسم نمودار برای همه کلاس‌ها در مودال
                    renderGroupedSHAPGraph(
                    shapValuesClass0,
                    shapValuesClass1,
                    shapValuesClass2,
                    "shap-chart-container"
                    );
                }
            }, 50); // بررسی هر 50 میلی‌ثانیه برای آماده بودن DOM
        });
    }
    
    return marker;
}

// تابع برای تولید توضیحات (Tooltip)
function generateTooltip(item, classType) {
    if (classType === "wahr") {
        return `
            <div>
                <strong>Position:</strong> (${item.Latitude.toFixed(4)}, ${item.Longitude.toFixed(4)})<br>
                <strong>Jahr:</strong> ${item.Jahr || "N/A"}<br>
                <strong>Monat:</strong> ${getMonthName(item.Monat) || "N/A"}<br>
                <strong>Schweregrad:</strong> ${getUnfallklasseName(item["Unfallklasse Wahr"])}<br>
            </div>
        `;
    } else if(classType === "bestimmt"){
        const wahrValue = item["Unfallklasse Wahr"];
        const bestimmtValue = item["Unfallklasse Bestimmt"];
        const isCorrect = wahrValue === bestimmtValue;
        const sicherheitScore = parseFloat(item["Unsicherheits-Score"]);
        const class0Prob =
            safeParseFloat(item["Wahrscheinlichkeit Klasse 0"]) / 100;
        const class1Prob =
            safeParseFloat(item["Wahrscheinlichkeit Klasse 1"]) / 100;
        const class2Prob =
            safeParseFloat(item["Wahrscheinlichkeit Klasse 2"]) / 100;
        return  `
            <strong>Jahr:</strong> ${item.Jahr}<br>
            <strong>Monat:</strong> ${item.Monat}<br>
            <strong>Wahr:</strong> ${wahrValue}<br>
            <strong>Bestimmt:</strong> ${bestimmtValue}<br>
            <strong>Unsicherheits:</strong> ${sicherheitScore.toFixed(2)}<br>
            <strong>Treffer:</strong> ${isCorrect ? "Korrekt" : "InKorrekt"}
            <br>
            <div style="font-size: 12px; width: 280px;">
                <div>
                    <strong>Klasse 0:</strong>
                    <div class='hover-bestimmt' style="
                        display: inline-block; 
                        background-color: ${getGrayShade(class0Prob)};
                        height: 10px; 
                        width: ${class0Prob * 100}%; 
                        max-width: 100%; 
                        border-radius: 3px;">
                    </div> ${Math.round(class0Prob * 100)}%
                    <br>
                    <strong>Klasse 1:</strong>
                    <div class='hover-bestimmt' style="
                        display: inline-block; 
                        background-color: ${getGrayShade(class1Prob)};
                        height: 10px; 
                        width: ${class1Prob * 100}%; 
                        max-width: 100%; 
                        border-radius: 3px;">
                    </div> ${Math.round(class1Prob * 100)}%
                    <br>
                    <strong>Klasse 2:</strong>
                    <div class='hover-bestimmt' style="
                        display: inline-block; 
                        background-color: ${getGrayShade(class2Prob)};
                        height: 10px; 
                        width: ${class2Prob * 100}%; 
                        max-width: 100%; 
                        border-radius: 3px;">
                    </div> ${Math.round(class2Prob * 100)}%
                </div>
            </div>
        `;
    }
}

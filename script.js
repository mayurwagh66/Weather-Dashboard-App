// OpenWeatherMap API configuration
const API_KEY = '';  // Enter your API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHER_URL = `${BASE_URL}/weather`;
const FORECAST_URL = `${BASE_URL}/forecast`;

// Theme switching functionality
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');
const themeText = themeToggle.querySelector('span');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'dark';
body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

// Theme toggle event listener
themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

// Update theme icon and text based on current theme
function updateThemeIcon(theme) {
    themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    themeText.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
}

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const currentDate = document.getElementById('current-date');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const forecastContainer = document.getElementById('forecast-container');

// --- Forecast Toggle and Hourly Forecast Logic ---
const fiveDayBtn = document.getElementById('five-day-btn');
const hourlyBtn = document.getElementById('hourly-btn');
const fiveDayForecastSection = document.getElementById('five-day-forecast');
const hourlyForecastSection = document.getElementById('hourly-forecast');
const hourlyDayFilter = document.getElementById('hourly-day-filter');
const hourlyForecastContainer = document.getElementById('hourly-forecast-container');

let lastForecastData = null;
let hourlyDays = [];
let selectedHourlyDay = null;

if (fiveDayBtn && hourlyBtn) {
    fiveDayBtn.addEventListener('click', () => {
        fiveDayBtn.classList.add('active');
        hourlyBtn.classList.remove('active');
        fiveDayForecastSection.style.display = '';
        hourlyForecastSection.style.display = 'none';
    });
    hourlyBtn.addEventListener('click', () => {
        fiveDayBtn.classList.remove('active');
        hourlyBtn.classList.add('active');
        fiveDayForecastSection.style.display = 'none';
        hourlyForecastSection.style.display = '';
        if (lastForecastData) {
            renderHourlyDayFilter(lastForecastData);
            renderHourlyForecastCards(lastForecastData, selectedHourlyDay);
        }
    });
}

function renderHourlyDayFilter(data) {
    // Group hourly data by day
    const days = {};
    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayKey = date.toISOString().split('T')[0];
        if (!days[dayKey]) days[dayKey] = [];
        days[dayKey].push(forecast);
    });
    hourlyDays = Object.keys(days).slice(0, 6); // Show up to 6 days
    // Default to first day if none selected
    if (!selectedHourlyDay || !hourlyDays.includes(selectedHourlyDay)) {
        selectedHourlyDay = hourlyDays[0];
    }
    hourlyDayFilter.innerHTML = '';
    // Add 'All Days' button
    const allBtn = document.createElement('button');
    allBtn.className = 'hourly-day-btn' + (selectedHourlyDay === 'all' ? ' active' : '');
    allBtn.textContent = 'All Days';
    allBtn.addEventListener('click', () => {
        selectedHourlyDay = 'all';
        renderHourlyDayFilter(data);
        renderHourlyForecastCards(data, 'all');
    });
    hourlyDayFilter.appendChild(allBtn);
    // Add a button for each day
    hourlyDays.forEach(dayKey => {
        const date = new Date(dayKey);
        const label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' });
        const btn = document.createElement('button');
        btn.className = 'hourly-day-btn' + (selectedHourlyDay === dayKey ? ' active' : '');
        btn.textContent = label;
        btn.addEventListener('click', () => {
            selectedHourlyDay = dayKey;
            renderHourlyDayFilter(data);
            renderHourlyForecastCards(data, dayKey);
        });
        hourlyDayFilter.appendChild(btn);
    });
}

function renderHourlyForecastCards(data, dayKey) {
    hourlyForecastContainer.innerHTML = '';
    let filtered = data.list;
    if (dayKey && dayKey !== 'all') {
        filtered = filtered.filter(forecast => {
            const date = new Date(forecast.dt * 1000);
            return date.toISOString().split('T')[0] === dayKey;
        });
    }
    if (filtered.length === 0) {
        hourlyForecastContainer.innerHTML = '<div style="color:#fff;opacity:0.7;padding:1rem;">No hourly data available.</div>';
        return;
    }
    filtered.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayLabel = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' });
        const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <div class="hourly-date">${dayLabel}</div>
            <div class="hourly-time">${timeLabel}</div>
            <div class="hourly-icon"><i class="fas ${getWeatherIcon(forecast.weather[0].main)}"></i></div>
            <div class="hourly-temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="hourly-desc">${forecast.weather[0].description}</div>
        `;
        hourlyForecastContainer.appendChild(card);
    });
}

// --- End Forecast Toggle and Hourly Forecast Logic ---

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
        getForecastData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
            getForecastData(city);
        }
    }
});

// Get weather data from OpenWeatherMap API
async function getWeatherData(city) {
    try {
        const response = await fetch(`${WEATHER_URL}?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();

        if (data.cod === '404') {
            alert('City not found. Please try again.');
            return;
        }

        if (data.cod === '401') {
            alert('API key is invalid or not activated. Please check your API key.');
            return;
        }

        if (data.cod !== 200) {
            alert(`Error: ${data.message || 'Unknown error occurred'}`);
            return;
        }

        updateWeatherUI(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data. Please try again.');
    }
}

// Get 5-day forecast data
async function getForecastData(city) {
    try {
        const response = await fetch(`${FORECAST_URL}?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();

        if (data.cod === '200') {
            updateForecastUI(data);
        }
    } catch (error) {
        console.error('Error fetching forecast data:', error);
    }
}

// Update forecast UI
function updateForecastUI(data) {
    forecastContainer.innerHTML = '';
    lastForecastData = data;
    
    // Get one forecast per day (excluding today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // Group forecasts by day
    const forecastsByDay = new Map();
    
    data.list.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        forecastDate.setHours(0, 0, 0, 0); // Reset time to start of day
        
        // Skip if it's today
        if (forecastDate.getTime() === today.getTime()) {
            return;
        }

        // Use date string as key
        const dateKey = forecastDate.toISOString().split('T')[0];
        
        // Only store one forecast per day (the one closest to noon)
        if (!forecastsByDay.has(dateKey) || 
            Math.abs(forecastDate.getHours() - 12) < Math.abs(new Date(forecastsByDay.get(dateKey).dt * 1000).getHours() - 12)) {
            forecastsByDay.set(dateKey, forecast);
        }
    });

    // Convert to array and sort by date
    const dailyForecasts = Array.from(forecastsByDay.values())
        .sort((a, b) => a.dt - b.dt)
        .slice(0, 5);

    if (dailyForecasts.length === 0) {
        console.log('No forecast data available');
        return;
    }

    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-date">${dayName}, ${monthDay}</div>
            <div class="forecast-icon">
                <i class="fas ${getWeatherIcon(forecast.weather[0].main)}"></i>
            </div>
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="forecast-desc">${forecast.weather[0].description}</div>
            <div class="forecast-details">
                <span><i class="fas fa-tint"></i> ${forecast.main.humidity}%</span>
                <span><i class="fas fa-wind"></i> ${forecast.wind.speed} m/s</span>
            </div>
        `;
        forecastContainer.appendChild(card);
    });

    // If hourly forecast is visible, update it
    if (hourlyForecastSection && hourlyForecastSection.style.display !== 'none') {
        renderHourlyDayFilter(data);
        renderHourlyForecastCards(data, selectedHourlyDay);
    }
}

// Get weather icon based on weather condition
function getWeatherIcon(weatherMain) {
    const icons = {
        'Clear': 'fa-sun',
        'Clouds': 'fa-cloud',
        'Rain': 'fa-cloud-rain',
        'Drizzle': 'fa-cloud-rain',
        'Thunderstorm': 'fa-bolt',
        'Snow': 'fa-snowflake',
        'Mist': 'fa-smog',
        'Smoke': 'fa-smog',
        'Haze': 'fa-smog',
        'Dust': 'fa-smog',
        'Fog': 'fa-smog',
        'Sand': 'fa-smog',
        'Ash': 'fa-smog',
        'Squall': 'fa-wind',
        'Tornado': 'fa-wind'
    };
    return icons[weatherMain] || 'fa-cloud';
}

// Update UI with weather data
function updateWeatherUI(data) {
    try {
        cityName.textContent = `${data.name}, ${data.sys.country}`;
        temperature.textContent = Math.round(data.main.temp);
        weatherDescription.textContent = data.weather[0].description;
        
        // Update current date
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDate.textContent = now.toLocaleDateString(undefined, options);
        
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${data.wind.speed} m/s`;
        pressure.textContent = `${data.main.pressure} hPa`;
        visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;

        // Convert sunrise and sunset times to local time
        const sunriseTime = new Date(data.sys.sunrise * 1000);
        const sunsetTime = new Date(data.sys.sunset * 1000);
        
        sunrise.textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunset.textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        console.error('Error updating UI:', error);
        alert('Error updating weather information. Please try again.');
    }
}

// Get user's location and fetch weather data
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const response = await fetch(
                        `${WEATHER_URL}?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=${API_KEY}`
                    );
                    const data = await response.json();

                    if (data.cod === '401') {
                        alert('API key is invalid or not activated. Please check your API key.');
                        return;
                    }

                    if (data.cod !== 200) {
                        alert(`Error: ${data.message || 'Unknown error occurred'}`);
                        return;
                    }

                    updateWeatherUI(data);
                    
                    // Also fetch forecast for the current location
                    const forecastResponse = await fetch(
                        `${FORECAST_URL}?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=${API_KEY}`
                    );
                    const forecastData = await forecastResponse.json();
                    if (forecastData.cod === '200') {
                        updateForecastUI(forecastData);
                    }
                } catch (error) {
                    console.error('Error fetching location weather:', error);
                    alert('Error fetching weather data for your location. Please try again.');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Error getting your location. Please enable location services or search for a city manually.');
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
        alert('Geolocation is not supported by your browser. Please search for a city manually.');
    }
}

// Initialize with user's location weather
getLocationWeather(); 
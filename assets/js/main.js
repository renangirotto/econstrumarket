let app = {}

app._init = function () {
    app._setDate()
    app._setForecast()
    app._filters()

    setTimeout(function () {
        app._dayCard()
    }, 1000)

    console.log('Custom Scripts Ready!')
}

// Set initial date and min/max dates for date input filter
app._setDate = function () {
    // Get single date filter input
    const dateInput = $('.single-filter').find('input[type="date"]')

    // Get todays date
    const getDate = {
        today: function () {
            let d = new Date(),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;

            return [year, month, day].join('-');
        },
        max: function () {
            let d = new Date();

            // add a day
            d.setDate(d.getDate() + 9);

            let month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear()

            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;

            return [year, month, day].join('-');
        },
    }

    // Set input date
    dateInput.attr('value', getDate.today())

    // Set Min Date
    dateInput.attr('min', getDate.today())

    // Set Max Date
    dateInput.attr('max', getDate.max())
}

// Set initial forecast data
app._setForecast = function () {
    // Check if there is data in the local storage
    let hasForecast = localStorage.getItem('hasForecast')

    if (hasForecast != null) {
        // If there is data verify if the data is 24 hours+ old
        let nextDay = new Date().getTime() + (1 * 24 * 60 * 60 * 1000)

        if (nextDay > new Date(hasForecast)) {
            buildForecast()
            buildSingleDay()
        }
        else if (nextDay < new Date(hasForecast)) {
            // The time is more than 1 days from now
            getForecast()
        }
    } else {
        // If there is not data request from api
        getForecast()
    }

    // API forecast request
    function getForecast() {
        $.ajaxPrefilter(function (options) {
            if (options.crossDomain && jQuery.support.cors) {
                var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
                options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
                //options.url = "http://cors.corsproxy.io/url=" + options.url;
            }
        });

        $.get(
            'https://api.hgbrasil.com/weather?woeid=455827?format=json&key=b7d9483e',
            function (response) {
                // Set forecast data in local storage
                localStorage.setItem('forecast', JSON.stringify(response.results.forecast))
                // Set date when the forecast was taken
                localStorage.setItem('hasForecast', new Date())
                // Call build items
                buildForecast()
                buildSingleDay()
            });
    }
}

// Control for range and date filters
app._filters = function () {
    // -----------------------------------------------
    // Filter by time range
    // -----------------------------------------------
    // Get filter select
    const filterRange = $('#filterRange')
    // Get calendar box
    const calendarBox = $('.calendar-box')

    // Control filter range on change
    filterRange.on('change', function () {
        if (this.value === 'plus') {
            calendarBox.addClass('show-plus')
        } else {
            calendarBox.removeClass('show-plus')
        }
    });

    // -----------------------------------------------
    // Filter by single date
    // -----------------------------------------------
    // Get filter select
    const filterDate = $('#filterDate')

    // Control filter date on change
    filterDate.on('change', function () {
        let selectedDay = this.value
        let forecast = JSON.parse(localStorage.getItem('forecast'))
        let dayMonth = forecast[0].date
        // Verify if date is in american style
        if (dayMonth.includes('-')) {
            // Build single day
            buildSingleDay(`${selectedDay.split('-')[1]}-${selectedDay.split('-')[2]}`, 'en')
        } else if (dayMonth.includes('/')) {
            // Build single day
            buildSingleDay(`${selectedDay.split('-')[1]}-${selectedDay.split('-')[2]}`)
        }
    });
}

// Control for card action
app._dayCard = function () {
    // Get card elements but ignore individual card
    let card = $('.day:not(.single)')
    // Get single date filter input
    const dateInput = $('.single-filter').find('input[type="date"]')

    // Set click action
    card.click(function () {
        // Get day target
        let target = $(this).attr('data-day')
        // Get current year
        let year = new Date().getFullYear()
        // Get day/month based on target
        let forecast = JSON.parse(localStorage.getItem('forecast'))
        let dayMonth = forecast[target].date
        // Verify if date is in american style
        if (dayMonth.includes('-')) {
            // Build single day
            buildSingleDay(`${dayMonth.split('-')[0]}-${dayMonth.split('-')[1]}`, 'en')
            // Set input date
            dateInput.attr('value', `${year}-${dayMonth.split('-')[0]}-${dayMonth.split('-')[1]}`)
        } else if (dayMonth.includes('/')) {
            // Build single day
            buildSingleDay(`${dayMonth.split('/')[1]}-${dayMonth.split('/')[0]}`)
            // Set input date
            dateInput.attr('value', `${year}-${dayMonth.split('/')[1]}-${dayMonth.split('/')[0]}`)
        }
    })
}

// Build for calendar content
function buildForecast() {
    // Get calendar container
    const container = $('#calendarBox')
    // Get forecast data in local storage
    let forecast = JSON.parse(localStorage.getItem('forecast'))

    // Clear calendar container
    container.empty()
    // Build forecast calendar
    $(forecast).each(function (index) {
        // Get objetc of the day
        let item = $(this)[0]
        // Build day html
        container.append(
            $('<div>').addClass(`col-sm-6 col-lg-4 col-xl-3 ${index >= 7 ? 'plus' : ''}`).append(
                $('<div>').addClass('day').attr('data-day', index).append(
                    $('<div>').addClass('day-date').append(
                        $('<span>').addClass('day-week').text(`${item.weekday}.`),
                        $('<strong>').addClass('day-month').text(item.date.replace('-', '/'))
                    ),
                    $('<figure>').addClass('day-icon').append(
                        $('<img>').attr('src', `assets/svg/${item.condition}.svg`)
                    ),
                    $('<div>').addClass('day-info').append(
                        $('<div>').addClass('temperature').append(
                            $('<div>').addClass('temperature-item').append(
                                $('<span>').text('Min.'),
                                $('<strong>').addClass('value').text(`${item.min}ºC`)
                            ),
                            $('<div>').addClass('temperature-item').append(
                                $('<span>').text('Max.'),
                                $('<strong>').addClass('value').text(`${item.max}ºC`)
                            )
                        ),
                        $('<p>').addClass('info').text(item.description)
                    )
                )
            )
        )
    })
}

// Build for single day content
function buildSingleDay(day = null, type = null) {
    // Get calendar container
    const container = $('#singleBox')
    // Get forecast data in local storage
    let forecast = JSON.parse(localStorage.getItem('forecast'))

    // Clear calendar container
    container.empty()

    // Check if there is date
    if (day != null) {
        // Get day/month
        let dateFull = day.split('-')
        let date = type === 'en' ? `${dateFull[0]}-${dateFull[1]}` : `${dateFull[1]}/${dateFull[0]}`

        // Read forecast to find selected date
        $(forecast).each(function () {
            // Get objetc of the day
            let item = $(this)[0]
            // Check if is the same date
            if (item.date === date) {
                buildHtml(item)
            }
        })
    } else {
        buildHtml(forecast[0])
    }

    // Build single day forecast html
    function buildHtml(item) {
        container.append(
            $('<div>').addClass('day single').append(
                $('<div>').addClass('day-date').append(
                    $('<span>').addClass('day-week').text(`${item.weekday}.`),
                    $('<strong>').addClass('day-month').text(item.date.replace('-', '/'))
                ),
                $('<figure>').addClass('day-icon').append(
                    $('<img>').attr('src', `assets/svg/${item.condition}.svg`)
                ),
                $('<div>').addClass('day-info').append(
                    $('<div>').addClass('temperature').append(
                        $('<div>').addClass('temperature-item').append(
                            $('<span>').text('Min.'),
                            $('<strong>').addClass('value').text(`${item.min}ºC`)
                        ),
                        $('<div>').addClass('temperature-item').append(
                            $('<span>').text('Max.'),
                            $('<strong>').addClass('value').text(`${item.max}ºC`)
                        )
                    ),
                    $('<p>').addClass('info').text(item.description)
                )
            )
        )
    }
}

$(function () {
    app._init()
});
let app = {}

app._init = function () {
    // GET WEATHER FROM API PROVIDER
    function getWeather() {
        let api = `https://api.hgbrasil.com/weather?woeid=455827`;

        fetch(api)
            .then(function (response) {
                let data = response.json();
                console.log(data)
                return data;
            });
    }

    getWeather()

    console.log('Custom Scripts Ready!')
}

$(function () {
    app._init()
});
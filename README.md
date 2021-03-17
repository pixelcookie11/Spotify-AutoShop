![GitHub Logo](/public/logo.svg)
## This is a fully automated shop designed to sell Spotify Premium Family upgrade codes without the need for a 3rd party or any middleman.

# Setup

This assumes that you already have a [BTCPayServer](https://btcpayserver.org/) setup. It also needs an automated checker for Spotify. I have included one that works with [SilverBullet](https://github.com/mohamm4dx/SilverBullet) in this repo.

If you already have that setup, then let's get started!

## Requirements

* [BTCPayServer](https://btcpayserver.org/). I am running it on Docker because it's easy and fast.
* Discord Server
* Discord bot created on the [Discord Developer Portal](https://discord.com/developers/applications) and it's associated bot token.
* SMTP Server (Can be Gmail)
* A VPS. Can be Linux or Windows.
* Some sort of automated checker. I will be using [SilverBullet](https://github.com/mohamm4dx/SilverBullet) in this guide. Why? Because it's easy to use and it's free and open source. If you are using your own checker you will need to modify it to POST hits to the API.
* A domain
* NGINX or a reverse proxy solution. Make sure to restrict access to `/hit/spotify` and `/api/check/invoice`

# Actual Setup

Got everything above covered? Great! Let's get started. Don't want to do this yourself? I offer managed setup services for cheap. Contact me on Discord (Cube#1337) or [Telegram](https://t.me/Cube1337x) if you are interested.

1. Clone this repo onto your Linux server `git clone https://github.com/pixelcookie11/AutoShop-API.git`.
1. Go into the directory. `cd AutoShop-API`
1. Edit the `example.env` file and rename it to `.env` when you are done.
1. ## _*CHANGE YOUR MYSQL PASSWORD*_
1. Change the logo and the promo image in `./public/logo.svg` and `./public/promo.svg` respectively.
1. Edit the HTML to how you see fit.
1. Open the SilverBullet config file and edit the `PLACEHOLDER` ([here](https://github.com/Kogeki/AutoShop-API/blob/5a44220fc6afe51e5f881fd21dce2714e712dddf/SpotifyConfig.svb#L440)) IP to your actual API's IP address.
1. Run `docker-compose up`

# FOR EDUCATIONAL PURPOSES ONLY! Gaining access to accounts you don't control is ILLEGAL! I am not liable for anyone who uses this application.


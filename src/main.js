const Apify = require('apify');
const scraper = require('./scraper')
const {
    login,
    verificationCheck,
    promptVerification,
    preparePage
} = require('./helpers')

Apify.main(async () => {

    // open fresh twitter
    const input = await Apify.getValue('INPUT');
    const launchPuppeteerOptions = Object.assign(input.proxyConfig || {}, { liveView: true });
    const browser = await Apify.launchPuppeteer(launchPuppeteerOptions);
    const page = await browser.newPage();
    await page.goto('https://twitter.com');

    // login
    await login(page, input)

    // check for human verification requirement
    const requiredVerification = await verificationCheck(page)

    // prompt for human verification, if needed
    if (requiredVerification) {
        const verificationCode = await promptVerification()

        // enter login verification
        await page.type('#challenge_response', verificationCode);
        await page.click('#email_challenge_submit');
    }

    // get tweet history
    const tweetHistory = await scraper.getActivity(browser, input.handle, input.tweetsDesired)

    // get user profile
    const userProfile = await scraper.getProfile(browser, input.handle)

    // get followers
    const followers = await scraper.getFollowers(browser, input.handle, input.followersDesired, 'followers')

    // get following
    const following = await scraper.getFollowers(browser, input.handle, input.followersDesired, 'following')

    // store data
    await Apify.pushData({
        userProfile: await userProfile,
        followers: await followers,
        following: await following,
        tweetHistory: await tweetHistory
    });
})
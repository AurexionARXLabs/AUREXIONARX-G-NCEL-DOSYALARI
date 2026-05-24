export default async function handler(req, res) {

    const { mint } = req.query;

    try {

        const response = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${mint}`
        );

        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {

        return res.status(500).json({
            error: error.message
        });

    }

}
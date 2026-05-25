// Vercel Serverless Function - CommonJS uyumlu
// URL: /api/token

const ARX_TOKEN_ADDRESS = "Hq6cJZpLJQymfafR4TYf1NHeiZCoup7zzczVUZbRpump";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  try {
    // 1. Dexscreener
    const dexUrl = "https://api.dexscreener.com/latest/dex/tokens/" + ARX_TOKEN_ADDRESS;
    const dexRes = await fetch(dexUrl);

    if (dexRes.ok) {
      const dexData = await dexRes.json();
      if (dexData.pairs && dexData.pairs.length > 0) {
        const pair = dexData.pairs.sort(function(a, b) {
          return (b.liquidity && b.liquidity.usd || 0) - (a.liquidity && a.liquidity.usd || 0);
        })[0];

        return res.status(200).json({
          source: "dexscreener",
          priceUsd: parseFloat(pair.priceUsd) || null,
          marketCap: pair.marketCap || pair.fdv || null,
          volume: (pair.volume && pair.volume.h24) || null,
          liquidity: (pair.liquidity && pair.liquidity.usd) || null,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 2. Fallback: pump.fun
    const pumpUrl = "https://frontend-api.pump.fun/coins/" + ARX_TOKEN_ADDRESS;
    const pumpRes = await fetch(pumpUrl);

    if (pumpRes.ok) {
      const data = await pumpRes.json();
      const price = data.usd_market_cap && data.total_supply
        ? data.usd_market_cap / data.total_supply
        : null;

      return res.status(200).json({
        source: "pump.fun",
        priceUsd: price,
        marketCap: data.usd_market_cap || null,
        volume: data.volume_24h || null,
        liquidity: data.virtual_sol_reserves || null,
        updatedAt: new Date().toISOString()
      });
    }

    return res.status(404).json({
      error: "Token henüz API'lerde bulunamadı",
      address: ARX_TOKEN_ADDRESS
    });

  } catch (err) {
    return res.status(500).json({
      error: "Sunucu hatası",
      message: err.message
    });
  }
};

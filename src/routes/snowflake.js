const express = require('express');
const { runQuery } = require('../utils/snowflakeUtils');

const router = express.Router();

router.get('/test', async (req, res) => {
    try {
        console.log(`process.env.SNOWFLAKE_USERNAME = ${process.env.SNOWFLAKE_USERNAME}`)

        // const query = 'SELECT CURRENT_TIMESTAMP'; // Example query
        // const query = 'select top 100 * from EDL_TITANIUM_HNE.DBO.CHART5 c'; // Example query
        const query = `call WS_DB_EHNSW_SDPR_DAMS.PUBLIC.EBLOOD_IMPORT_FROM_AUTODUMP_TO_TRANSFORMEDTABLE(
                null
                , 'BBIS_2006-2_AD2_SA_20250325_Updated.txt'
                , 'WS_DB_EHNSW_SDPR_DAMS.U60345797.TOM_EBLOOD_PIPELINE_RAW'
                , 'WS_DB_EHNSW_SDPR_DAMS.U60345797.TOM_EBLOOD_PIPELINE_TRANSFORMED'
            )
`

        const result = await runQuery(query);
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('Error executing Snowflake query:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
let clients = [];

function sendUpdates(data) {
    clients.forEach((client) => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
}

function processUpdateHandler(req, res) {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add the client to the list
    const clientId = Date.now();
    clients.push({ id: clientId, res });

    // Send an initial message to confirm connection
    res.write(`data: ${JSON.stringify({ details: 'Connected to updates' })}\n\n`);

    // Remove the client when the connection is closed
    req.on('close', () => {
        clients = clients.filter((client) => client.id !== clientId);
    });
}

module.exports = {
    processUpdateHandler,
    sendUpdates,
};
module.exports.authenticateAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        return next();
    } else {
        console.log({ message: 'Access denied' });
        return res.status(403).json({ message: 'Access denied' });
    }
};

module.exports.authenticateArtist = (req, res, next) => {
    if (req.session && req.session.role === 'artist') {
        return next();
    } else {
        console.log({ message: 'Access denied' });
        return res.status(403).json({ message: 'Access denied' });
    }
};

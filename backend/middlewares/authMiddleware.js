// backend/middlewares/authMiddleware.js

// 管理者用ミドルウェア：セッションに管理者の情報が保存されているかチェックします。
// ここでは、管理者ログイン時に req.session.adminUserId と req.session.adminRole がセットされ、
// adminRole が 'admin' であることを確認します。
module.exports.authenticateAdmin = (req, res, next) => {
    if (req.session && req.session.adminUserId && req.session.adminRole === 'admin') {
        return next();
    } else {
        console.log({ message: 'Access denied' });
        return res.status(403).json({ message: 'Access denied' });
    }
};

// アーティスト用ミドルウェア：セッションにアーティストの情報が保存されているかチェックします。
// ここでは、アーティストログイン時に req.session.artistUserId と req.session.artistRole がセットされ、
// artistRole が 'artist' であることを確認します。
module.exports.authenticateArtist = (req, res, next) => {
    if (req.session && req.session.artistUserId && req.session.artistRole === 'artist') {
        return next();
    } else {
        console.log({ message: 'Access denied' });
        return res.status(403).json({ message: 'Access denied' });
    }
};

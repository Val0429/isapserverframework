/*
 * Created on Tue Oct 17 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

function secureContentType(req, res, next) {
    res.setHeader("X-Content-Type-Options", "nosniff");

    next();
}

export {
    secureContentType
}
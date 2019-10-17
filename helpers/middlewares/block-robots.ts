/*
 * Created on Tue Oct 17 2019
 * Author: Val Liu
 * Copyright (c) 2019, iSAP Solution
 */

function blockRobots(req, res, next) {
    res.setHeader("X-Robots-Tag", "noindex");

    next();
}

export {
    blockRobots
}
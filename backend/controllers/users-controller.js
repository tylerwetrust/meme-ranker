const db = require('../services/db');
const bcrypt = require('bcrypt');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const upload = require('../services/file-upload');
const { body, validationResult } = require('express-validator');


// number of rounds for hashing
const saltRounds = 10;
// prepared query statements
const insertUserQuery = "INSERT INTO users (username, email, password, profile_img_path, bio) VALUES ($1,$2,$3,$4,$5) RETURNING *";
const getUserByIdQuery = "SELECT username, bio, profile_img_path FROM users WHERE user_id=$1";
const getUserByUsername = "SELECT * FROM users WHERE username=$1";
const getUserByEmailQuery = "SELECT * FROM users WHERE email=$1";
const updateUserQuery = "UPDATE users SET password=$1, bio=$2 WHERE user_id=$3";
const updateUserPhotoQuery = "UPDATE users SET profile_img_path=$1 WHERE user_id=$2";
const deleteUserQuery = "DELETE FROM users WHERE user_id=$1";
const findUserByIdQuery = "SELECT * FROM users WHERE user_id=$1";
const countUsernamePagesQuery = "SELECT user_id, username, bio, profile_img_path FROM users WHERE LOWER(username) LIKE $1 || '%'";
const getUsernamePageQuery = "SELECT user_id, username, bio, profile_img_path FROM users WHERE LOWER(username) LIKE $1 || '%' LIMIT 10 OFFSET $2";



// CRUD 
async function getUserById(req, res, next) {
    try {
        const uid = req.params.uid;
        const queryResult = await db.query(getUserByIdQuery, [uid]);
        if (queryResult.rowCount > 0) {
            const user = new User(queryResult.rows[0].username, "", "", queryResult.rows[0].bio, queryResult.rows[0].profile_img_path);
            res.json(user);
        }
        else {
            res.json("Invalid user id.");
        }
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

async function createUser(req, res, next) {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password, bio } = req.body;
    try {
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        const newUser = await db.query(insertUserQuery,
            [username,
                email,
                hash,
                req.file ? req.hostname + ':4000' + '/' + res.req.file.filename : "",
                bio]);
    }
    catch (error) {
        console.log(error);
        res.status(400).send();
    }
    res.status(200).send();
}

async function updateUser(req, res, next) {
    const uid = req.params.uid;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { password, bio } = req.body;
    try {

        await db.query(updateUserQuery, [password, bio, uid]);
    }
    catch (err) {
        next(err);
    }
    res.status(200).send();
}

async function deleteUser(req, res, next) {
    const uid = req.params.uid;
    try {
        await db.query(deleteUserQuery, [uid]);
    } catch (error) {
        next(error);
    }
    res.status(200).send();
}

async function getUsersByUsername(req, res, next) {
    const page = req.query.page;
    const searchQuery = req.query.searchQuery.toLowerCase();
    if (!searchQuery) {
        const err = new HttpError('Search query cannot be null', 400);
        return res.json(err);
    } n
    let offset;
    if (page) offset = (page - 1) * 10;
    else offset = 0;
    let results = {};
    try {
        const pages = await db.query(countUsernamePagesQuery, [searchQuery]);
        results.totalPages = Math.ceil(pages.rowCount / 10);
        const queryResult = await db.query(getUsernamePageQuery, [searchQuery, offset]);
        results.users = queryResult.rows.map(row => {
            return { user_id: row.user_id, username: row.username, profileImgPath: row.profile_img_path };
        });
        results.page = page;
    } catch (error) {
        console.log("neeeece");
        console.log(error);
        res.sendStatus(400);
    }
    res.json(results);

}

async function login(req, res, next) {
    const { username, password } = req.body;
    const user = await findUserByUsername(username);
    if (user) {
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) return res.status(200).json('Succesfuly logged in');
        });
    }
    else {
        return res.status(401).json('Bad username or password');
    }
}



// DB Validation functions


async function findUserByUsername(username) {
    let user;
    try {
        const queryResult = await db.query(getUserByUsername, [username]);
        if (queryResult.rowCount > 0) {
            user = new User(queryResult.rows[0].username, queryResult.rows[0].email, queryResult.rows[0].password, queryResult.rows[0].bio, queryResult.rows[0].profile_img_path);
        }
        else {
            user = null;
        }
    }
    catch (err) {
        user = null;
        console.log(err);
    }
    return user;
}
async function findUserByEmail(email) {
    let user;
    try {
        const queryResult = await db.query(getUserByEmailQuery, [email]);
        if (queryResult.rowCount > 0) {
            user = new User(queryResult.rows[0].username, queryResult.rows[0].email, queryResult.rows[0].password, queryResult.rows[0].bio, queryResult.rows[0].profile_img_path);
        }
        else {
            user = null;
        }
    }
    catch (err) {
        user = null;
        console.log(err);
    }
    return user;
}

async function findUserById(id) {
    let user;
    try {
        const queryResult = await db.query(findUserByIdQuery, [id]);
        if (queryResult.rowCount > 0) {
            user = new User(queryResult.rows[0].username, queryResult.rows[0].email, queryResult.rows[0].password, queryResult.rows[0].bio, queryResult.rows[0].profile_img_path);
        }
        else {
            user = null;
        }
    }
    catch (err) {
        user = null;
    }
    return user;
}

exports.createUser = createUser;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.findUserById = findUserById;
exports.findUserByUsername = findUserByUsername;
exports.findUserByEmail = findUserByEmail;
exports.getUsersByUsername = getUsersByUsername;
exports.login = login;
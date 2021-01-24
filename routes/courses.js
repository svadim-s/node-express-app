const {Router} = require('express');
const {validationResult} = require('express-validator/check');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const {courseValidators} = require('../utils/validators');
const router = Router();

function isOwner(course, req) {
    return course.userId.toString() === req.user._id.toString();
}

router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().lean()
        .populate('userId', 'email name')
        .select('price title img');
   
        res.render('courses', {
           title: 'Курсы',
           isCourses: true,
           userId: req.user ? req.user._id.toString() : null,
           courses
        });
    } catch (e) {
        console.log(e);
    }
});

router.get('/:_id/edit', auth, async (req, res) => {
    if (!req.query.allow) {
        return res.redirect('/');
    }

    try {
        const course = await Course.findById(req.params._id).lean();

        if (!isOwner(course, req)) {
            return res.redirect('/courses');
        }

        res.render('course-edit', {
            title: `Редактировать ${course.title}`,
            course
        });
    } catch (e) {
        console.log(e);
    }
});

router.post('/edit', auth, courseValidators, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).redirect(`/courses/${req.body.id}/edit?allow=true`);
    }

    try {
        await Course.findByIdAndUpdate(req.body._id, req.body).lean();
        res.redirect('/courses');
    } catch (e) {
        console.log(e);
    }
});

router.post('/remove', auth, async (req, res) => {
    try {
        await Course.deleteOne({
            _id: req.body.id,
            userId: req.user._id
        });
        res.redirect('/courses');
    } catch (e) {
        console.log(e);
    }
})

router.get('/:_id', async (req, res) => {
    try {
        const course = await Course.findById(req.params._id).lean();

        res.render('course', {
            layout: 'empty',
            title: `Курс ${course.title}`,
            course
        });
    } catch (e) {
        console.log(e);
    }
});

module.exports = router;
var del              = require('del');
var gulp             = require('gulp');
var runSequence      = require('run-sequence');
var postcss          = require('gulp-postcss');
var autoprefixer     = require('autoprefixer');
var cssimport        = require('postcss-import');
var calc             = require("postcss-calc")
var colorFunction    = require("postcss-color-function")
var customproperties = require('postcss-custom-properties');
var apply            = require('postcss-apply');
var mixins           = require('postcss-mixins');
var nested           = require('postcss-nested');
var customMedia      = require("postcss-custom-media");
var utilities        = require('postcss-utilities');
var nano             = require('gulp-cssnano');
var plumber          = require('gulp-plumber');
var notify           = require('gulp-notify');
var rename           = require('gulp-rename');
var validateCss      = require('csstree-validator').validateFile;
var reporter         = require('csstree-validator').reporters.json;
var config           = require('./projectConfig.json').config;

var fs = require("fs");


var onError = function(err) {
    notify.onError({
        title: "Gulp",
        subtitle: "Failure!",
        message: "Error: <%= error.message %>",
        sound: "Beep"
    })(err);

    this.emit('end');
};

gulp.task('css', function(callback) {

    if (!callback) callback = function() {};
    //TODO: eliminar  runSequence cuando se instale gulp v4
    runSequence('_css', '_validateCss','_cleanTmpFile', callback);
});

gulp.task('_css', function() {
    var processors = [
        cssimport,
        autoprefixer({ browsers: 'last 2 versions' }),
        customproperties,
        calc,
        colorFunction,
        apply,
        utilities,
        mixins,
        nested,
        customMedia
    ];
    var configNano = config.nano;

    var fileContent = fs.readFileSync(config.css.mainCSSFile, "utf8");
    var optionalFileContent = '';

    if ( config.enableDebug === true ) {
      console.log('Generamos el fichero CSS con info de debug');
      optionalFileContent = fs.readFileSync(config.css.debugCSSFile, "utf8");
    }

    fs.writeFileSync( config.css.srcCSSFolder + 'tmp.pcss', fileContent + ' ' + optionalFileContent);

    return gulp.src(config.css.srcCSSFolder + 'tmp.pcss')
        .pipe(plumber({ errorHandler: onError }))
        .pipe(postcss(processors))
        .pipe(rename(config.css.distCSSFolder + "/style.css"))
        .pipe(gulp.dest(config.css.distCSSFolder))
        .pipe(nano(configNano))
        .pipe(rename(config.css.distCSSFolder + "/style.min.css"))
        .pipe(gulp.dest(config.css.distCSSFolder));
});

// la task css hace un archivo tmp.pcss que lleva (o no) estilos de debug. Al acabar el proceso hay que eliminarlo
gulp.task('_cleanTmpFile',function(){
  return del([config.css.srcCSSFolder + 'tmp.pcss'], {force: true});
});

gulp.task('_validateCss', function() {

    var error = JSON.parse(reporter(validateCss(config.css.distCSSFolder + "/style.css")));
    var errStr = '';
    var filename = '';

    if (!!error && error.length === 0) {
        console.log('Notificamos que somos unos cracks :D');
    } else {

        for (var i = 0; i < error.length; i++) {
            //ponemos solo el nombre del archivo en lugar de la ruta completa
            filename = error[i].name.replace(/^.*[\\\/]/, '');
            errStr += '(' + (i + 1) + ' de ' + error.length + ') ' + filename + ':' + error[i].line + ' - ' + error[i].property + ' - ' + error[i].message + '\n\n';
        }
        console.log(errStr);

        notify.onError({
            title: "Gulp",
            subtitle: "Failure!",
            message: errStr,
            sound: "Beep"
        })(errStr);
    }

});

// gulp.task('cssComb', function() {
// return gulp.src(config.css.srcCSSFolder+"**/*.pcss")
// .pipe(csscomb())
// .pipe(gulp.dest(config.css.srcCSSFolder));
// })

// Watch
gulp.task('watch', function() {
    // Watch .css files
    gulp.watch(config.css.srcCSSFolder + '**/*.pcss', ['css']);
});

// Default
gulp.task('default', ['css', 'watch']);
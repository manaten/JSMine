gulp = require 'gulp'

gulp.task 'copy:assets', ->
  gulp.src 'src/assets/**/*'
  .pipe gulp.dest 'build/assets'


replace = require 'gulp-replace-async'
datauri = require 'datauri'
through2 = require 'through2'
browserify = require 'browserify'
babelify = require 'babelify'
gulp.task 'build:js', ->
  # https://gist.github.com/Problematic/c95444472e6d3c5f8460
  gulp
  .src './src/js/**'
  # .pipe replace /\.\/assets\/mine\.png/g, (match, done) ->
  #   datauri './src/assets/mine.png', done
  # .pipe replace /\.\/assets\/mine\.json/g, (match, done) ->
  #   datauri './src/assets/mine.json', done
  .pipe through2.obj (file, enc, next) ->
    return next null if !/src\/js\/app\.js$/.test file.path
    browserify file.path, {debug: true}
    .transform babelify
    .bundle (err, res) ->
      return next err if err
      file.contents = res
      next null, file
  .on 'error', (err) ->
    console.log err.message
    console.log err.codeFrame if err.codeFrame
    this.emit 'end'
  .pipe gulp.dest 'build/js'

jade = require 'gulp-jade'
gulp.task 'build:html', ->
  gulp.src 'src/*.jade'
  .pipe jade()
  .pipe gulp.dest 'build'

webserver = require 'gulp-webserver'
gulp.task 'webserver', ->
  gulp.src 'build'
  .pipe webserver
    directoryListing: false
    open: false
    host: '0.0.0.0'
    port: 8080
    fallback: 'index.html'

gulp.task 'watch', ->
  gulp.watch ['src/**/*.js'], ['build:js']
  gulp.watch ['src/assets/**/*'], ['copy:assets']
  gulp.watch ['src/**/*.jade'], ['build:html']

gulp.task 'build', ['build:js', 'build:html', 'copy:assets']
gulp.task 'start', ['build', 'webserver']
gulp.task 'debug', ['build', 'watch', 'webserver']

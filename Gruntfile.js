
        
module.exports = function(grunt) {
    var local = grunt.file.exists('local.json') ? grunt.file.readJSON('local.json') : {};
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                curly: true,
                eqeqeq: false, // we embrace coercion (http://javascriptweblog.wordpress.com/2011/02/07/truth-equality-and-javascript)
                es3: true,
                immed: true,
                latedef: 'nofunc',
                newcap: false,
                noarg: true,
                undef: true,
                unused: true,
                strict: true,
                trailing: false, // set to 'true' to forbid trailing whitespace

                // suppress warnings:
                boss: true,
                eqnull: true,
                globalstrict: true,
                globals: {
                    module: true,
                    require: true,
                    angular: true,
                    _: true,
                    esi: true,
                    console:true,
                    Raphael:true,
                    window:true
                }
            },
            all: ['app/js/**/*.js', '!app/js/translations.js']
        },

        connect: {
            options: {
                base: 'app'
            },
            test: {
                options: {
                    port: 9001
                }
            },
            server: {
                options: {
                    port: 8000,
                }
            }
        },
        // Grunt task for browserify
        watchify: {
            options: {
                debug: true
            },
            dev: {
                src: './app/js/todoAppDev.js',
                dest: 'app/dist/bundle.js'
            }
        }

    });


    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-watchify');


    grunt.registerTask('default', ['connect:server', 'watchify:dev:keepalive']);
    

};

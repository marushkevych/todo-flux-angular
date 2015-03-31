
        
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
        karma: {
            unit: {
                configFile: 'test/karma.conf.js',
                runnerPort: 9999,
                browsers: ['PhantomJS']
            },
            spec: {
                configFile: 'test/karma.conf.js',
                singleRun: true,
                browsers: ['PhantomJS'],
                reporters: ['spec']
            },
            e2e: {
                configFile: 'test/karma-e2e.conf.js',
                singleRun: true,
                browsers: ['PhantomJS'],
                reporters: ['spec']
            },
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
            },
            test: {
                src: './test/unit/**/*Spec.js',
                dest: 'test/unit/spec-bundle.js'
            }
        },
        
        nggettext_extract: {
            pot: {
                files: {
                    'po/template.pot': ['app/templates/*.html','app/js/**/*.js']
                }
            },
        },

        nggettext_compile: {
            all: {
                files: {
                    'app/js/translations.js': ['po/*.po']
                }
            },
        }
        

    });


    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-watchify');
    grunt.loadNpmTasks('grunt-angular-gettext');

    // Default - jshint and all tests
    grunt.registerTask('default', ['jshint', 'watchify', 'karma:spec', 'connect:test']);

    // run unit tests continuously (watch fot changes)
    grunt.registerTask('unit', ['watchify:test','karma:unit']);
    
    // run unit tests once and generate specs
    grunt.registerTask('spec', ['watchify:test','karma:spec']);
    
    // run e2e tests
    grunt.registerTask('e2e', ['watchify:dev','connect:test', 'karma:e2e']);


    grunt.registerTask('server', ['connect:server', 'watchify:dev:keepalive']);
    

};

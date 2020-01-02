# lpc (Locally Proxied Cache)

LPC is a local http service that enables proxying and cache outgoing requests. Its main use case is to speed up booting of apps that requires multiple http requests to be accomplished before finishing the starting process, although it can be used for any case where an http proxy makes sense.

# How to use
Run following command:
```sh
    $ npx lpc <PARAMETERS>
```

# Command Line Help / Parameters
Run following command to get a list of available parameters:
```sh
    $ npx lpc --help
```

### Requirements
lpc requires [Node.js](https://nodejs.org/) v10+ to run.

#### Building for source
To build lpc locally, run
```sh
$ git clone https://github.com/juancancela/lpc.git
```

### Todos
 - Unit Tests
 - More testing!

License
----
MIT
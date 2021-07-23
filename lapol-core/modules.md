# Modules

A LaPoL module is fundamentally a `Javascript` module, which exports an object satisfying the interface `ModuleDeclaration`.

The main component of this interface is the loader function. This is a function that receives a `ModuleLoader` object. By calling methods on this object, a module can programmatically declare itself.

See the folder `src/std` for example modules. (However, don't start with `std/core`. That one is pretty complicated!)

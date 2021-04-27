import { read_file_at_once, write_file_at_once } from "./la_utils"

function console_main() {
    console.log('Hello, LaPoL!')
    console.log(process.argv)
    
    let args = process.argv.slice(2)
    console.log(args)

    if (args.length === 0) {
        console.log('No arguments passed, using default debug mode')

        let data = read_file_at_once('test/test_read.txt')
        write_file_at_once('test/test_write.txt', data)
    }
}


console_main()
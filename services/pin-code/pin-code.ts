

    // /// Generate pin code
    // let db = await sharedMongoDB();
    // let col = db.collection("Pins");
    // let totalSize = 900000;
    // let unitSize = 4;
    // if (await col.findOne({}) === null) {
    //     console.log("<PinCode> Creating...");
    //     console.time("<PinCode> 6 Digits Pincode Created");
    //     let pinNumbers = new Array();
    //     for (let i=100000, j=0; i<1000000; ++i, ++j) {
    //         pinNumbers[j] = i;
    //     }
    //     function shuffle(array) {
    //         let currentIndex = array.length, temporaryValue, randomIndex;
    //         // While there remain elements to shuffle...
    //         while (0 !== currentIndex) {
    //             // Pick a remaining element...
    //             randomIndex = Math.floor(Math.random() * currentIndex);
    //             currentIndex -= 1;

    //             // And swap it with the current element.
    //             temporaryValue = array[currentIndex];
    //             array[currentIndex] = array[randomIndex];
    //             array[randomIndex] = temporaryValue;
    //         }
    //     }
    //     shuffle(pinNumbers);
    //     /// store into buffer
    //     let buf = new Buffer(totalSize*unitSize);
    //     for (let i=0; i<pinNumbers.length; ++i) {
    //         buf.writeUInt32BE(pinNumbers[i], i*unitSize);
    //     }
        
    //     /// Batch save pin code into database
    //     col.insert({
    //         index: 0, total: totalSize, pin: buf
    //     }, () => {
    //         console.timeEnd("<PinCode> 6 Digits Pincode Created");
    //     });
    // }
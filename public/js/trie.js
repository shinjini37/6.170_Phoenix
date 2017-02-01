// From Shinjini's project 1

// http://pythonfiddle.com/python-trie-implementation/ was used to get a better understanding of how Tries work
// (the python was easier to read that the other languages)

var Trie = function(){
    // Protection from rep exposure:
    // the private variable root is in this function's closure and is never
    // returned by any of the public methods
    // Object.freeze prevents the public methods from being changed

    // create the object to return
    var that = Object.create(Trie.prototype);

    // private subclass
    var TrieNode = function(){
        // Protection from rep exposure:
        // the private variables is in this function's closure and are never
        // returned by any of the public methods
        // The public methods never return any aliases of the private functions, and
        // the only time a node's private variables (nodes, nodeWord and isLeaf) can be
        // changed is in the insert method, but it only changes it appropriately
        // Object.freeze prevents the public methods from being changed

        // create the object to return
        var that = Object.create(TrieNode.prototype);

        // private variables
        var nodeWord = '';
        var nodes = {};
        var isLeaf = false;

        // private functions
        // allowing setting of node words is dangerous
        var setNodeWord = function(word){
            isLeaf = (word.length>0);
            nodeWord = word;
        };

        /**
         * Gets the word associated with the node
         * if no word is present, return the empty string
         * @returns {string} the word associated with the node or the empty string if no word is present
         */
        that.getNodeWord = function(){
            return nodeWord;
        };

        /**
         * Returns whether or not the node is a leaf
         * @returns {boolean} whether or not the node is a leaf
         */
        that.isLeaf = function(){
            return isLeaf;
        };

        /**
         * Inserts a word from the stringPosition given, with the current TrieNode being the root
         * @param word the word to insert
         * @param stringPosition the position of the string to insert from
         */
        that.insertWord = function(word, stringPosition){
            if (!stringPosition){
                stringPosition = 0;
            }

            // Base case: if this is that last letter in word,
            // (ie, the last call to insert word created this node, and
            // now stringPosition === word.length),
            // save this word as the node's word
            if (stringPosition === word.length){
                setNodeWord(word);
            } else {
                var currentLetter = word[stringPosition];
                if (!(currentLetter in nodes)){
                    // create a new node for this letter
                    nodes[currentLetter] = TrieNode();
                }

                // continue inserting the next letters in this word
                nodes[currentLetter].insertWord(word, stringPosition+1);
            }

        };


        /**
         * Given a prefix and a stringPosition, returns an array of words that match that prefix starting
         * from that stringPosition in the prefix
         * @param prefix {String} a prefix to match
         * @param stringPosition current position of the prefix being looked at. Should be 0 at the start
         * @returns {Array.<String>} array of ten words that match that prefix, in sorted order
         */
        that.findAllWordsWithPrefix = function(prefix, stringPosition){
            if (!stringPosition){
                stringPosition = 0;
            }

            var letters = Object.keys(nodes);

            // if this node doesn't have any children, since you've already added this node's word to the list
            // from the parent's recursion, just return an empty array
            // (Base Case)
            if (letters.length===0){
                return [];
            }

            // if there are children, gather up the words at their leaves using recursion
            // (Recursive case)
            return letters.filter(function(letter){
                // if you've already passed the prefix check and are in a branch that contains
                // the prefix, OR if you found a branch (next node) that goes to the next letter
                // of the prefix, search this branch for a word
                return (stringPosition>= prefix.length) || letter === prefix[stringPosition];
            }).reduce(function(currentList, nextLetter){
                // this is the current node you're at
                var node = nodes[nextLetter];
                // if you've passed the prefix (or are at the last letter) and you've found a word,
                // add it to the list
                if (stringPosition>= prefix.length-1){
                    if (node.isLeaf()){
                        currentList.push(node.getNodeWord());
                    }
                }

                // keep going down this branch (using recursion) in case there are more words
                var moreWords = [];
                // if you haven't gotten to the end of the prefix yet, search the branches with
                // the next letter in the prefix
                if (stringPosition+1<=prefix.length){
                    moreWords = node.findAllWordsWithPrefix(prefix, stringPosition+1);
                } else { // if you have, then search the next branches (don't worry about prefix)
                    moreWords = node.findAllWordsWithPrefix(prefix, stringPosition);
                }
                currentList = currentList.concat(moreWords);
                return currentList;

            }, []);
        };

        Object.freeze(that);
        return that;
    };


    // private variables
    var root = TrieNode();

    /**
     * Adds a word to the Trie
     * @param word {String} word to add
     */
    that.addWord = function(word){
        root.insertWord(word, 0);
    };

    /**
     * Given a prefix, returns an array of all words that match that prefix, in sorted order
     * @param prefix {String} a prefix to match
     * @returns {Array.<String>} array of ten words that match that prefix, in sorted order
     */
    that.autocomplete = function(prefix){
        var allWords = root.findAllWordsWithPrefix(prefix, 0).sort();
        // return allWords.slice(0,10);
        return allWords;
    };
    Object.freeze(that);
    return that;

};


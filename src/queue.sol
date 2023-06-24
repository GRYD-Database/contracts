pragma solidity >=0.8.4;
contract Queue {
    struct NodesQueue {
        mapping (address => address /* or any other type */ ) queue;
        address node;
    }
    uint256 first = 1;
    uint256 last = 1;

    function enqueue(NodesQueue storage node) public {
        last += 1;
        queue[address] = node;
    }

    function dequeue() public returns (address) {
        address node;
        require(last > first);
        node = queue[first];
        delete queue[first];
        first += 1;
        return node;
    }
    function length() public view returns (uint256) {
        return last - first;
    }
}

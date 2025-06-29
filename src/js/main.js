window.onload = function () {
  // const errorEl = document.getElementById('error');
  // console.log('errorEl is:', errorEl);
  var flask = new CodeFlask();
  var defaultCode =
    "function init() { \n console.log('hello world'); \n} \ninit();";
  flask.run("#my-code-wrapper", {
    language: "js",
  });

  flask.update(defaultCode);
  const errorEl = document.getElementById("error");
  if (errorEl) {
    errorEl.textContent = "";
  }
  // if ($('#error').length) {
  //     $('#error').text('');
  // }

  renderVisuals(generateAst(defaultCode));

  flask.onUpdate(function (code) {
    // var ast = generateAst(code);
    // renderVisuals(ast);

    $("#test1, #test2").empty();
    // clear previous error
    // if ($('#error').length) {
    //     $('#error').text('');
    // }
    if (errorEl) {
      errorEl.textContent = "";
    }

    try {
      var ast = generateAst(code);
      renderVisuals(ast);
    } catch (e) {
      // $('#error').text(e.message);
      errorEl.textContent = e.message;
      console.log(e.message);
    }
  });
  //new addition

  function renderChart(container, ast) {
    // First, build the same hash of node-type counts:
    const counts = {};
    traverse(JSON.parse(JSON.stringify(ast)), {
      pre(node) {
        delete node.children;
      },
      post(node) {
        counts[node.type] = (counts[node.type] || 0) + 1;
      },
    });

    // Convert to array and sort descending:
    const data = Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // D3 code to draw a simple bar chart:
    const svg = d3.select("#chart");
    svg.selectAll("*").remove(); // clear old

    const margin = { top: 20, right: 20, bottom: 100, left: 50 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.type))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .nice()
      .range([height, 0]);

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("y", 10)
      .attr("x", -5)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Y axis
    g.append("g").call(d3.axisLeft(y));

    // Bars
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.type))
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.count));
  }

  // And finally, in your existing `renderVisuals`:
  function renderVisuals(ast) {
    renderTree(document.getElementById("test1"), ast);
    renderAnalysis(document.getElementById("test2"), ast);
    renderAst(document.getElementById("test3"), ast);
    renderChart(document.getElementById("test4"), ast);
  }
  function generateAst(code) {
    var ast = esprima.parse(code);

    traverse(ast, {
      pre: function (node) {
        if (node.body && !Array.isArray(node.body)) {
          node.body = [node.body];
        }
        node.children = node.body ? node.body : [];
      },
    });
    return ast;
  }

  //   function renderVisuals(ast) {
  //     renderTree(document.getElementById("test1"), ast);
  //     renderAnalysis(document.getElementById("test2"), ast);
  //     renderAst(document.getElementById("test3"), ast);
  //   }

  function renderAst(container, ast) {
    var astEditor = new CodeFlask();
    var code = JSON.stringify(ast, null, 4);
    astEditor.run("#ast-wrapper", {
      language: "js",
    });
    astEditor.update(code);
  }

  function renderAnalysis(container, ast) {
    var ast = Object.assign({}, ast);
    var hash = {};
    traverse(ast, {
      pre: function (node) {
        delete node.children;
      },
      post: function (node) {
        hash.hasOwnProperty(node.type)
          ? (hash[node.type] = hash[node.type] + 1)
          : (hash[node.type] = 1);
      },
    });

    var $table = $('<table class="highlight"/>');
    var $tbody = $table.append("<tbody></tbody>");
    for (var prop in hash) {
      $tbody.append(
        "<tr><td>" + prop + "</td><td>" + hash[prop] + "</td></tr>"
      );
    }
    $(container).append($table);
  }

  function renderTree(container, ast) {
    var treeData = ast;

    // set the dimensions and margins of the diagram
    var margin = { top: 40, right: 90, bottom: 50, left: 90 },
      width = 660 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // declares a tree layout and assigns the size
    var treemap = d3.tree().size([width, height]);

    //  assigns the data to a hierarchy using parent-child relationships
    var nodes = d3.hierarchy(treeData);

    // maps the node data to the tree layout
    nodes = treemap(nodes);

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3
      .select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
    var g = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // adds the links between the nodes
    var link = g
      .selectAll(".link")
      .data(nodes.descendants().slice(1))
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", function (d) {
        return (
          "M" +
          d.x +
          "," +
          d.y +
          "C" +
          d.x +
          "," +
          (d.y + d.parent.y) / 2 +
          " " +
          d.parent.x +
          "," +
          (d.y + d.parent.y) / 2 +
          " " +
          d.parent.x +
          "," +
          d.parent.y
        );
      });

    // adds each node as a group
    var node = g
      .selectAll(".node")
      .data(nodes.descendants())
      .enter()
      .append("g")
      .attr("class", function (d) {
        return "node" + (d.children ? " node--internal" : " node--leaf");
      })
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    // adds the circle to the node
    node.append("circle").attr("r", 10);

    // adds the text to the node
    node
      .append("text")
      .attr("dy", ".35em")
      .attr("y", function (d) {
        return d.children ? -20 : 20;
      })
      .style("text-anchor", "middle")
      .text(function (d) {
        return d.data.type;
      });
  }
  document.getElementById("mode-toggle").addEventListener("click", () => {
    const body = document.body;
    const toggleBtn = document.getElementById("mode-toggle");

    body.classList.toggle("light-mode");

    if (body.classList.contains("light-mode")) {
      toggleBtn.innerText = "🌞";
    } else {
      toggleBtn.innerText = "🌙";
    }
  });
};

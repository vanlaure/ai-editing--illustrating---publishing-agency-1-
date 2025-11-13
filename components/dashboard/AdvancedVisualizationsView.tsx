import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CollaborationNode {
  id: string;
  name: string;
  value: number;
  group: string;
}

interface CollaborationLink {
  source: string;
  target: string;
  value: number;
}

interface ActivityData {
  hour: number;
  day: string;
  value: number;
}

interface HierarchyNode {
  name: string;
  value?: number;
  children?: HierarchyNode[];
}

interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  category: string;
}

const AdvancedVisualizationsView: React.FC = () => {
  const [selectedViz, setSelectedViz] = useState<'network' | 'heatmap' | 'sunburst' | 'stream'>('network');
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const networkRef = useRef<SVGSVGElement>(null);
  const heatmapRef = useRef<SVGSVGElement>(null);
  const sunburstRef = useRef<SVGSVGElement>(null);
  const streamRef = useRef<SVGSVGElement>(null);

  // Sample collaboration data
  const collaborationData = {
    nodes: [
      { id: '1', name: 'Author A', value: 50, group: 'writers' },
      { id: '2', name: 'Editor B', value: 40, group: 'editors' },
      { id: '3', name: 'Illustrator C', value: 35, group: 'artists' },
      { id: '4', name: 'Author D', value: 45, group: 'writers' },
      { id: '5', name: 'Editor E', value: 38, group: 'editors' },
      { id: '6', name: 'Designer F', value: 30, group: 'artists' },
      { id: '7', name: 'Proofreader G', value: 25, group: 'editors' },
      { id: '8', name: 'Author H', value: 42, group: 'writers' },
    ] as CollaborationNode[],
    links: [
      { source: '1', target: '2', value: 10 },
      { source: '1', target: '4', value: 8 },
      { source: '2', target: '3', value: 12 },
      { source: '2', target: '5', value: 15 },
      { source: '3', target: '6', value: 9 },
      { source: '4', target: '5', value: 11 },
      { source: '5', target: '7', value: 7 },
      { source: '1', target: '8', value: 6 },
      { source: '4', target: '8', value: 13 },
    ] as CollaborationLink[],
  };

  // Sample activity heatmap data
  const activityData: ActivityData[] = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      activityData.push({
        day: days[day],
        hour,
        value: Math.floor(Math.random() * 100),
      });
    }
  }

  // Sample hierarchy data for sunburst
  const hierarchyData: HierarchyNode = {
    name: 'Projects',
    children: [
      {
        name: 'Fiction',
        children: [
          { name: 'Novel A', value: 1200 },
          { name: 'Short Story B', value: 450 },
          {
            name: 'Series C',
            children: [
              { name: 'Book 1', value: 800 },
              { name: 'Book 2', value: 650 },
            ],
          },
        ],
      },
      {
        name: 'Non-Fiction',
        children: [
          { name: 'Biography D', value: 900 },
          { name: 'Technical E', value: 750 },
        ],
      },
      {
        name: 'Poetry',
        children: [
          { name: 'Collection F', value: 300 },
          { name: 'Anthology G', value: 550 },
        ],
      },
    ],
  };

  // Sample stream graph data
  const streamData: TimeSeriesPoint[] = [];
  const categories = ['Writing', 'Editing', 'Illustrating', 'Marketing'];
  for (let i = 0; i < 30; i++) {
    categories.forEach(category => {
      streamData.push({
        timestamp: Date.now() - (29 - i) * 86400000,
        value: Math.random() * 100 + 20,
        category,
      });
    });
  }

  // Network Graph Rendering
  useEffect(() => {
    if (selectedViz !== 'network' || !networkRef.current) return;

    const svg = d3.select(networkRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const simulation = d3
      .forceSimulation(collaborationData.nodes as any)
      .force(
        'link',
        d3
          .forceLink(collaborationData.links)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Color scale for groups
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(['writers', 'editors', 'artists'])
      .range(['#3b82f6', '#10b981', '#f59e0b']);

    // Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(collaborationData.links)
      .join('line')
      .attr('stroke', '#6b7280')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: CollaborationLink) => Math.sqrt(d.value));

    // Nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(collaborationData.nodes)
      .join('g')
      .call(
        d3
          .drag<any, CollaborationNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      );

    node
      .append('circle')
      .attr('r', (d: CollaborationNode) => Math.sqrt(d.value) * 2)
      .attr('fill', (d: CollaborationNode) => colorScale(d.group))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2);

    node
      .append('text')
      .text((d: CollaborationNode) => d.name)
      .attr('x', 0)
      .attr('y', (d: CollaborationNode) => Math.sqrt(d.value) * 2 + 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '12px');

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'absolute hidden bg-gray-800 text-white p-2 rounded shadow-lg text-sm')
      .style('pointer-events', 'none');

    node
      .on('mouseover', function (event, d: CollaborationNode) {
        tooltip
          .html(`<strong>${d.name}</strong><br/>Collaborations: ${d.value}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px')
          .classed('hidden', false);
      })
      .on('mouseout', function () {
        tooltip.classed('hidden', true);
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      if (!event.subject.fixed) {
        d.fx = null;
        d.fy = null;
      }
    }

    return () => {
      tooltip.remove();
    };
  }, [selectedViz, collaborationData]);

  // Heatmap Rendering
  useEffect(() => {
    if (selectedViz !== 'heatmap' || !heatmapRef.current) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(d3.range(0, 24).map(String))
      .range([0, innerWidth])
      .padding(0.05);

    const yScale = d3
      .scaleBand()
      .domain(days)
      .range([0, innerHeight])
      .padding(0.05);

    const colorScale = d3
      .scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(activityData, d => d.value) || 100]);

    // Heatmap cells
    g.selectAll('rect')
      .data(activityData)
      .join('rect')
      .attr('x', (d: ActivityData) => xScale(String(d.hour)) || 0)
      .attr('y', (d: ActivityData) => yScale(d.day) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: ActivityData) => colorScale(d.value))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#9ca3af')
      .style('font-size', '10px');

    g.selectAll('.domain, .tick line').attr('stroke', '#4b5563');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('fill', '#9ca3af')
      .style('font-size', '12px');

    g.selectAll('.domain, .tick line').attr('stroke', '#4b5563');

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .style('font-size', '14px')
      .text('Hour of Day');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .style('font-size', '14px')
      .text('Day of Week');

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'absolute hidden bg-gray-800 text-white p-2 rounded shadow-lg text-sm')
      .style('pointer-events', 'none');

    g.selectAll('rect')
      .on('mouseover', function (event, d: any) {
        tooltip
          .html(`<strong>${d.day} ${d.hour}:00</strong><br/>Activity: ${d.value}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px')
          .classed('hidden', false);
      })
      .on('mouseout', function () {
        tooltip.classed('hidden', true);
      });

    return () => {
      tooltip.remove();
    };
  }, [selectedViz, activityData]);

  // Sunburst Rendering
  useEffect(() => {
    if (selectedViz !== 'sunburst' || !sunburstRef.current) return;

    const svg = d3.select(sunburstRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    const radius = Math.min(width, height) / 2;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create hierarchy
    const root = d3
      .hierarchy(hierarchyData)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Partition layout
    const partition = d3.partition<HierarchyNode>().size([2 * Math.PI, radius]);
    partition(root);

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Arc generator
    const arc = d3
      .arc<d3.HierarchyRectangularNode<HierarchyNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1);

    // Arcs
    const arcs = g
      .selectAll('path')
      .data(root.descendants() as d3.HierarchyRectangularNode<HierarchyNode>[])
      .join('path')
      .attr('d', arc as any)
      .attr('fill', (d: d3.HierarchyRectangularNode<HierarchyNode>) => colorScale(d.data.name))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .style('opacity', 0.8);

    // Labels
    g.selectAll('text')
      .data(
        (root.descendants() as d3.HierarchyRectangularNode<HierarchyNode>[]).filter(d => {
          const angle = d.x1 - d.x0;
          return d.depth > 0 && angle > 0.1;
        })
      )
      .join('text')
      .attr('transform', (d: d3.HierarchyRectangularNode<HierarchyNode>) => {
        const angle = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
        const radius = (d.y0 + d.y1) / 2;
        return `rotate(${angle - 90}) translate(${radius},0) rotate(${angle < 180 ? 0 : 180})`;
      })
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: d3.HierarchyRectangularNode<HierarchyNode>) => {
        const angle = (d.x0 + d.x1) / 2;
        return angle < Math.PI ? 'start' : 'end';
      })
      .attr('fill', '#e5e7eb')
      .style('font-size', '11px')
      .text((d: d3.HierarchyRectangularNode<HierarchyNode>) => d.data.name);

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'absolute hidden bg-gray-800 text-white p-2 rounded shadow-lg text-sm')
      .style('pointer-events', 'none');

    arcs
      .on('mouseover', function (event, d: any) {
        d3.select(this).style('opacity', 1);
        tooltip
          .html(`<strong>${d.data.name}</strong><br/>Value: ${d.value}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px')
          .classed('hidden', false);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 0.8);
        tooltip.classed('hidden', true);
      });

    return () => {
      tooltip.remove();
    };
  }, [selectedViz, hierarchyData]);

  // Stream Graph Rendering
  useEffect(() => {
    if (selectedViz !== 'stream' || !streamRef.current) return;

    const svg = d3.select(streamRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 120, bottom: 40, left: 60 };

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Transform data for stack
    const timestamps = Array.from(new Set(streamData.map(d => d.timestamp))).sort();
    const stackData = categories.map(category => {
      return timestamps.map(timestamp => {
        const point = streamData.find(d => d.timestamp === timestamp && d.category === category);
        return {
          timestamp,
          value: point ? point.value : 0,
          category,
        };
      });
    });

    // Scales
    const xScale = d3
      .scaleTime()
      .domain([d3.min(timestamps) || 0, d3.max(timestamps) || 0])
      .range([0, innerWidth]);

    const stack = d3
      .stack<any>()
      .keys(categories)
      .value((d: any, key: string) => {
        const point = streamData.find(p => p.timestamp === d && p.category === key);
        return point ? point.value : 0;
      })
      .offset(d3.stackOffsetWiggle);

    const series = stack(timestamps);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(series, s => d3.min(s, d => d[0])) || 0,
        d3.max(series, s => d3.max(s, d => d[1])) || 0,
      ])
      .range([innerHeight, 0]);

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(categories)
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444']);

    // Area generator
    const area = d3
      .area<any>()
      .x((d, i) => xScale(timestamps[i]))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCatmullRom);

    // Stream paths
    g.selectAll('path')
      .data(series)
      .join('path')
      .attr('d', area)
      .attr('fill', d => colorScale(d.key))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1)
      .style('opacity', 0.8);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat(d3.timeFormat('%b %d') as any)
      )
      .selectAll('text')
      .attr('fill', '#9ca3af')
      .style('font-size', '11px');

    g.selectAll('.domain, .tick line').attr('stroke', '#4b5563');

    // Legend
    const legend = g
      .append('g')
      .attr('transform', `translate(${innerWidth + 20}, 0)`);

    categories.forEach((category, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 25})`);

      legendRow
        .append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(category));

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('fill', '#e5e7eb')
        .style('font-size', '12px')
        .text(category);
    });
  }, [selectedViz, streamData]);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Advanced Visualizations</h1>
        <p className="text-gray-400">Explore your data with interactive D3.js visualizations</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedViz('network')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedViz === 'network'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Network Graph
            </button>
            <button
              onClick={() => setSelectedViz('heatmap')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedViz === 'heatmap'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Activity Heatmap
            </button>
            <button
              onClick={() => setSelectedViz('sunburst')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedViz === 'sunburst'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Sunburst Chart
            </button>
            <button
              onClick={() => setSelectedViz('stream')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedViz === 'stream'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Stream Graph
            </button>
          </div>

          <label className="flex items-center space-x-2 text-gray-300">
            <input
              type="checkbox"
              checked={animationEnabled}
              onChange={e => setAnimationEnabled(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Enable Animation</span>
          </label>
        </div>
      </div>

      {/* Visualization Container */}
      <div className="bg-gray-800 rounded-lg p-6">
        {selectedViz === 'network' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Collaboration Network</h2>
            <p className="text-gray-400 mb-4">
              Drag nodes to explore connections. Node size represents collaboration frequency.
            </p>
            <div className="flex justify-center">
              <svg ref={networkRef} className="border border-gray-700 rounded" />
            </div>
          </div>
        )}

        {selectedViz === 'heatmap' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Activity Heatmap</h2>
            <p className="text-gray-400 mb-4">
              Visualize activity patterns across days and hours. Darker colors indicate higher activity.
            </p>
            <div className="flex justify-center">
              <svg ref={heatmapRef} className="border border-gray-700 rounded" />
            </div>
          </div>
        )}

        {selectedViz === 'sunburst' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Project Hierarchy</h2>
            <p className="text-gray-400 mb-4">
              Explore hierarchical project structure. Each ring represents a level of depth.
            </p>
            <div className="flex justify-center">
              <svg ref={sunburstRef} className="border border-gray-700 rounded" />
            </div>
          </div>
        )}

        {selectedViz === 'stream' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Activity Stream</h2>
            <p className="text-gray-400 mb-4">
              Track activity trends over time. Different colors represent different categories.
            </p>
            <div className="flex justify-center">
              <svg ref={streamRef} className="border border-gray-700 rounded" />
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Network Graph</h3>
          <p className="text-sm text-gray-400">
            Force-directed graph showing collaboration patterns between team members.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Activity Heatmap</h3>
          <p className="text-sm text-gray-400">
            Time-based heatmap revealing peak activity hours and days.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Sunburst Chart</h3>
          <p className="text-sm text-gray-400">
            Hierarchical visualization showing project structure and relative sizes.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Stream Graph</h3>
          <p className="text-sm text-gray-400">
            Flowing visualization of activity trends across multiple categories over time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVisualizationsView;
import React, { useState, useEffect } from 'react';
import styles from './TestablageOneo.module.scss';
import type { ITestablageOneoProps } from './ITestablageOneoProps';
// import { escape } from '@microsoft/sp-lodash-subset';
// import { render } from 'react-dom';
// import MuiTreeView from 'material-ui-treeview';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
// import List from '@material-ui/core/List';
// import ListItem from '@material-ui/core/ListItem';
// import ListItemText from '@material-ui/core/ListItemText';
// import Collapse from '@material-ui/core/Collapse';
// import ExpandLess from '@material-ui/icons/ExpandLess';
// import ExpandMore from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/core/styles';
import { Drawer, TableContainer, Table, TableBody, TableRow, TableCell, IconButton, Typography, TableHead } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { SPHttpClient, /* SPHttpClientResponse */ } from '@microsoft/sp-http';
import Snackbar from '@material-ui/core/Snackbar';
import CloseIcon from '@material-ui/icons/Close';
import FolderIcon from '@material-ui/icons/Folder';
import { TableSortLabel } from '@material-ui/core';
import { Box } from '@material-ui/core';
import { ExpandMore, ChevronRight } from '@material-ui/icons';

// interface NodeData {
//   id: number;
//   name: string;
// }

interface TreeNode {
  value: string;
  nodes?: TreeNode[];
  data?: any[];
  level: number;
}

const useStyles = makeStyles({
  drawer: {
    width: '20%',
    flexShrink: 0,
  },
  drawerPaper: {
    width: '20%',
    backgroundColor: '#0078d4',
  },
  treeItemLabel: {
    color: '#ffffff',
  },
  treeItemIcon: {
    color: '#ffffff',
    position: 'relative',
    top: '-3px',
  },
  treeItemContainer: {
    display: 'flex',
    alignItems: 'center',
    color: '#ffffff',
  },
  title: {
    padding: '16px', // Add padding as needed
    color: '#ffffff', // Set the color to white
  },
  table: {
    // border: '1px solid #0078d4',
    width: '100%'
  },
  tableHead: {
    width: '100%',
  },
  tableCell: {
    wordWrap: 'break-word',
    maxWidth: 203,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sortingText: {
    '&.MuiTableSortLabel-root': {
      color: '#ffffff',
    },
    '&.MuiTableSortLabel-active': {
      color: '#ffffff',
    },
    '&.MuiTableSortLabel-icon': {
      color: '#ffffff',
    },
  },
  header: {
    backgroundColor: '#0078d4',
    color: 'white',
  },
});

const TestablageOneo: React.FC<ITestablageOneoProps> = (props) => {
  const classes = useStyles();
  const [isTreeViewVisible, setIsTreeViewVisible] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<(TreeNode | null)[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [gridData, setGridData] = useState<any[]>([]); // Add this line
  const [expanded, setExpanded] = React.useState<string[]>([]);
  // New state variable for filtered grid data
  const [filteredGridData, setFilteredGridData] = useState<any[]>([]);

  const [expandedAtEachLevel, setExpandedAtEachLevel] = useState<(string | null)[]>([]);

  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState('Title');
  const [isLoading, setIsLoading] = useState(true);

  const handleSort = (column: any) => {
    setSortBy(column);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const fetchListTree = async (): Promise<TreeNode[]> => {
    const listName = 'OneoListe';
    const url = `${props.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;

    const response = await props.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
    const data = await response.json();
    console.log(data);

    const tree: TreeNode[] = [];
    const betriebMap: { [key: string]: TreeNode } = {};

    data.value.forEach((item: any) => {
      let betriebNode = betriebMap[item.field_1]; // Betrieb
      if (!betriebNode) {
        betriebNode = { value: item.field_1, nodes: [], level: 1 }; // Betrieb
        betriebMap[item.field_1] = betriebNode; // Betrieb
        tree.push(betriebNode);
      }

      let bereichNode = (betriebNode.nodes?.find(node => node.value === item.field_2)) as TreeNode; // Bereich
      if (!bereichNode) {
        bereichNode = { value: item.field_2, nodes: [], level: 2 }; // Bereich
        betriebNode.nodes?.push(bereichNode);
      }

      let dokumentenartNode = (bereichNode.nodes?.find(node => node.value === item.field_3)) as TreeNode; // Dokumentenart
      if (!dokumentenartNode) {
        dokumentenartNode = { value: item.field_3, nodes: [], level: 3 }; // Dokumentenart
        bereichNode.nodes?.push(dokumentenartNode);
      }

      let zusatzNode = (dokumentenartNode.nodes?.find(node => node.value === item.field_4)) as TreeNode; // Zusatz
      if (!zusatzNode) {
        zusatzNode = { value: item.field_4, data: [], nodes: [], level: 4 }; // Zusatz
        dokumentenartNode.nodes?.push(zusatzNode);
      }

      zusatzNode.data?.push(item);
    });

    return tree;
  };

  const renderTree = (node: TreeNode) => (
    <TreeItem
      key={node.value}
      nodeId={node.value}
      label={
        <div
          className={classes.treeItemContainer}
          // onClick={(event) => node && handleLeafClick(event, node)}
        >
          <Box marginRight={1}>
            <FolderIcon />
          </Box>
          {node.value}
        </div>
      }
      onClick={(event) => handleLeafClick(event, node)}
      onIconClick={(event) => onIconClick(event, node)}
      classes={{ label: classes.treeItemLabel }}
      expandIcon={node.nodes && node.nodes.length > 0 ? <ChevronRight className={classes.treeItemIcon} /> : null}
      collapseIcon={node.nodes && node.nodes.length > 0 ? <ExpandMore className={classes.treeItemIcon} /> : null}
      // onIconClick={(event) => {
      //   event.stopPropagation(); // Stop event propagation
      //   setExpanded(prev => prev.includes(node.value) ? prev.filter(id => id !== node.value) : [...prev, node.value]);
      //   // Update selectedNodes state
      //   let newSelectedNodes: (TreeNode | null)[] = [...selectedNodes];
      //   newSelectedNodes[node.level - 1] = node;
      //   // Reset the lower level selections
      //   for (let i = node.level; i < newSelectedNodes.length; i++) {
      //     newSelectedNodes[i] = null;
      //   }
      //   setSelectedNodes(newSelectedNodes);
      // }}
    >
      {Array.isArray(node.nodes) ? node.nodes.map(node => renderTree(node)) : null}
    </TreeItem>
  );

  const handleMenuIconClick = (): void => {
    setIsTreeViewVisible(!isTreeViewVisible);
  };

  const [open, setOpen] = React.useState(false);

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const flattenTree = (nodes: TreeNode[]): any[] => {
    return nodes.reduce((acc: any[], node) => {
      const nodeData = node.data || [];
      const childData = node.nodes ? flattenTree(node.nodes) : [];
      return acc.concat(nodeData, childData);
    }, []);
  };

  // Fetch data and set it to gridData in the useEffect hook
  useEffect(() => {
    console.log('selectedNode changed', selectedNodes);
    // Add your code that depends on the updated selectedNode state here
    fetchListTree().then(tree => {
      setTree(tree);
      const flatData = flattenTree(tree);
      setGridData(flatData);
      setIsLoading(false);
    });
  }, [selectedNodes]);

  if (isLoading) {
    return <div>Laden...</div>;
  }

  const handleLeafClick = (event: React.MouseEvent, node: TreeNode): void => {
    event.stopPropagation(); // Stop event propagation
    let newSelectedNodes: (TreeNode | null)[] = [...selectedNodes];
    newSelectedNodes[node.level - 1] = node;
    // If a higher level node is selected, reset the lower level selections
    for (let i = node.level; i < newSelectedNodes.length; i++) {
      newSelectedNodes[i] = null;
    }
    setSelectedNodes(newSelectedNodes);
    filterData(newSelectedNodes);
  
    // Update the expanded node at the clicked node's level
    let newExpandedAtEachLevel = [...expandedAtEachLevel];
    newExpandedAtEachLevel[node.level - 1] = node.value;
    // If a higher level node is selected, reset the expandedAtEachLevel state for all levels below it
    for (let i = node.level; i < newExpandedAtEachLevel.length; i++) {
      newExpandedAtEachLevel[i] = null;
    }
    setExpandedAtEachLevel(newExpandedAtEachLevel);
  
    // Update the expanded state to include only the expanded nodes at each level
    setExpanded(newExpandedAtEachLevel.filter(value => value !== null) as string[]);
  };
  
    const onIconClick = (event: React.MouseEvent, node: TreeNode): void => {
      event.stopPropagation(); // Stop event propagation
      // Update the expanded node at the clicked node's level
      let newExpandedAtEachLevel = [...expandedAtEachLevel];
      newExpandedAtEachLevel[node.level - 1] = node.value;
      // If a level 1 or level 2 node is clicked, reset the expandedAtEachLevel state for all levels below it
      if (node.level === 1 || node.level === 2) {
        for (let i = node.level; i < newExpandedAtEachLevel.length; i++) {
          newExpandedAtEachLevel[i] = null;
        }
      }
      setExpandedAtEachLevel(newExpandedAtEachLevel);
    
      // Update the expanded state to include only the expanded nodes at each level
      setExpanded(newExpandedAtEachLevel.filter(value => value !== null) as string[]);
    
      // Update selectedNodes state
      let newSelectedNodes: (TreeNode | null)[] = [...selectedNodes];
      newSelectedNodes[node.level - 1] = node;
      // Reset the lower level selections
      for (let i = node.level; i < newSelectedNodes.length; i++) {
        newSelectedNodes[i] = null;
      }
      setSelectedNodes(newSelectedNodes);
      filterData(newSelectedNodes);
    };

  const findNodeByValue = (value: string, nodes: TreeNode[]): TreeNode | null => {
    for (let node of nodes) {
      if (node.value === value) {
        return node;
      } else if (node.nodes) {
        const result = findNodeByValue(value, node.nodes);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };
  
  // Filter the data based on the selected nodes
  const filterData = (selectedNodes: (TreeNode | null)[]): void => {
    let filteredData = gridData;
    if (selectedNodes[0]) {
      filteredData = filteredData.filter(row => row.field_1 === selectedNodes[0]?.value);
    }
    if (selectedNodes[1]) {
      filteredData = filteredData.filter(row => row.field_2 === selectedNodes[1]?.value);
    }
    if (selectedNodes[2]) {
      filteredData = filteredData.filter(row => row.field_3 === selectedNodes[2]?.value);
    }
    if (selectedNodes[3]) {
      filteredData = filteredData.filter(row => row.field_4 === selectedNodes[3]?.value);
    }
    setFilteredGridData(filteredData);
  };

  // Use filteredGridData to render the rows in the table
  // {
  //   (selectedNode ? filteredGridData : gridData)
  //     .sort((a, b) => (a[sortBy] < b[sortBy] ? -1 : 1) * (sortDirection === 'asc' ? 1 : -1))
  //     .map((row, index) => (
  //       <TableRow key={index}>
  //         <TableCell>{row.Title}</TableCell>
  //         <TableCell>{row.Betrieb}</TableCell>
  //         <TableCell>{row.Bereich}</TableCell>
  //         <TableCell>{row.Dokumentenart}</TableCell>
  //         <TableCell>{row.Zusatz}</TableCell>
  //         <TableCell>{row.Dateiname}</TableCell>
  //       </TableRow>
  //     ))
  // }

  //${hasTeamsContext ? styles.teams : ''}
  return (
    <section className={`${styles.testablageOneo}`}>
      <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleMenuIconClick}>
        <MenuIcon />
      </IconButton>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="left"
        open={isTreeViewVisible}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={handleMenuIconClick}>
            <MenuIcon style={{ color: 'white' }} />
          </IconButton>
        </div>
        <Typography variant="h6" className={classes.title}>
          SP-Eigenschaften
        </Typography>
        <TreeView
          expanded={expanded}
        >
          {tree.map(renderTree)}
        </TreeView>
      </Drawer>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead className={classes.tableHead}>
            <TableRow>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Title'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Betrieb'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Betrieb')}
                >
                  Betrieb
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Bereich'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Bereich')}
                >
                  Bereich
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Dokumentenart'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Dokumentenart')}
                >
                  Dokumentenart
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Zusatz'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Zusatz')}
                >
                  Zusatz
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Dateiname'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Dateiname')}
                >
                  Dateiname
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {console.log(gridData)} */}
            {
              selectedNodes.length > 0
                ? (filteredGridData)
                  .sort((a, b) => (a[sortBy] < b[sortBy] ? -1 : 1) * (sortDirection === 'asc' ? 1 : -1))
                  .map((row, index) => {
                    console.log('row:', row);
                    return (
                      <TableRow key={index}>
                        <TableCell className={classes.tableCell}>{row.Title}</TableCell>
                        <TableCell className={classes.tableCell}>{row.field_1}</TableCell>
                        <TableCell className={classes.tableCell}>{row.field_2}</TableCell>
                        <TableCell className={classes.tableCell}>{row.field_3}</TableCell>
                        <TableCell className={classes.tableCell}>{row.field_4}</TableCell>
                        <TableCell className={classes.tableCell}>{row.field_5}</TableCell>
                      </TableRow>
                    );
                  })
                : <TableRow>
                  <TableCell colSpan={7}>Bitte treffen Sie zuerst eine Auswahl.</TableCell>
                </TableRow>
            }
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={`Selected node: ${selectedNodes ? selectedNodes[0]?.value : 'None'}`}
        action={
          <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
      />
      {/* <div className={styles.welcome}>
        <img alt="" src={isDarkTheme ? require('../assets/welcome-dark.png') : require('../assets/welcome-light.png')} className={styles.welcomeImage} />
        <h2>Well done, {escape(userDisplayName)}!</h2>
        <div>{environmentMessage}</div>
        <div>Web part property value: <strong>{escape(description)}</strong></div>
      </div>
      <div>
        <h3>Welcome to SharePoint Framework!</h3>
        <p>
          The SharePoint Framework (SPFx) is a extensibility model for Microsoft Viva, Microsoft Teams and SharePoint. It&#39;s the easiest way to extend Microsoft 365 with automatic Single Sign On, automatic hosting and industry standard tooling.
        </p>
        <h4>Learn more about SPFx development:</h4>
        <ul className={styles.links}>
          <li><a href="https://aka.ms/spfx" target="_blank" rel="noreferrer">SharePoint Framework Overview</a></li>
          <li><a href="https://aka.ms/spfx-yeoman-graph" target="_blank" rel="noreferrer">Use Microsoft Graph in your solution</a></li>
          <li><a href="https://aka.ms/spfx-yeoman-teams" target="_blank" rel="noreferrer">Build for Microsoft Teams using SharePoint Framework</a></li>
          <li><a href="https://aka.ms/spfx-yeoman-viva" target="_blank" rel="noreferrer">Build for Microsoft Viva Connections using SharePoint Framework</a></li>
          <li><a href="https://aka.ms/spfx-yeoman-store" target="_blank" rel="noreferrer">Publish SharePoint Framework applications to the marketplace</a></li>
          <li><a href="https://aka.ms/spfx-yeoman-api" target="_blank" rel="noreferrer">SharePoint Framework API reference</a></li>
          <li><a href="https://aka.ms/m365pnp" target="_blank" rel="noreferrer">Microsoft 365 Developer Community</a></li>
        </ul>
      </div> */}
    </section>
  );
}
// function formatDate(dateString: string) {
//   const [day, month, year] = dateString.split(".");
//   return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
// }
export default TestablageOneo;

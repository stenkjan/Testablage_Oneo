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
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import Snackbar from '@material-ui/core/Snackbar';
import CloseIcon from '@material-ui/icons/Close';
import FolderIcon from '@material-ui/icons/Folder';
import { TableSortLabel } from '@material-ui/core';
import { Box } from '@material-ui/core'; 
import { ExpandMore, ChevronRight } from '@material-ui/icons';

interface NodeData {
  id: number;
  name: string;
}

interface TreeNode {
  value: string;
  nodes?: TreeNode[];
  data?: NodeData[];
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
    border: '1px solid #0078d4',
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
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [gridData, setGridData] = useState<any[]>([]); // Add this line


  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState('Title');

  const handleSort = (column: any) => {
    setSortBy(column);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const fetchFolder = async (folderUrl: string): Promise<TreeNode> => {
    const url = `${props.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${folderUrl}')/Folders`;

    const response = await props.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
    const data = await response.json();

    const nodes: TreeNode[] = await Promise.all(data.value.map(async (folder: any) => {
      const subFolderUrl = `${folderUrl}/${folder.Name}`;
      return fetchFolder(subFolderUrl);
    }));

    return {
      value: folderUrl.split('/').pop() || '',
      nodes,
    };
  };

  const handleLeafClick = (node: any): void => {
    console.log("Leaf clicked: ", node);
    setSelectedNode(node);
  };

  const renderTree = (node: TreeNode) => (
    <TreeItem
      key={node.value}
      nodeId={node.value}
      label={
        <div className={classes.treeItemContainer}>
          <Box marginRight={1}>
            <FolderIcon />
          </Box>
          {node.value}
        </div>
      }
      classes={{ label: classes.treeItemLabel }}
      expandIcon={node.nodes && node.nodes.length > 0 ? <ChevronRight className={classes.treeItemIcon} /> : null}
      collapseIcon={node.nodes && node.nodes.length > 0 ? <ExpandMore className={classes.treeItemIcon} /> : null}
      onClick={() => handleLeafClick(node)}
    >
      {Array.isArray(node.nodes) && node.nodes.length > 0 ? node.nodes.map(renderTree) : null}
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

  useEffect(() => {
    const fetchRootFolder = async () => {
      const rootFolder = await fetchFolder('/sites/Testablage_JS/Dateien');
      setTree([rootFolder]);
    };

    fetchRootFolder();

    const listName = 'Ablageliste';
    const url = `${props.siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;

    props.context.spHttpClient.get(url, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => response.json())
      .then((data) => {
        setGridData(data.value);
      })
      .catch((error: any) => {
        console.error('Error fetching data:', error);
      });
  }, []);

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
          Dateien
        </Typography>
        <TreeView>
          {tree.map(renderTree)}
        </TreeView>
      </Drawer>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
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
                  active={sortBy === 'Dateiname'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Dateiname')}
                >
                  Dateiname
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Auftragnummer'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Auftragnummer')}
                >
                  Auftragnummer
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Erstellt am'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Erstellt am')}
                >
                  Erstellt am
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Geändert am'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Geändert am')}
                >
                  Geändert am
                </TableSortLabel>
              </TableCell>
              <TableCell className={classes.header}>
                <TableSortLabel
                  active={sortBy === 'Auftraggeber'}
                  direction={sortDirection}
                  className={classes.sortingText}
                  onClick={() => handleSort('Auftraggeber')}
                >
                  Auftraggeber
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {console.log(gridData)} */}
            {gridData
              .sort((a, b) => (a[sortBy] < b[sortBy] ? -1 : 1) * (sortDirection === 'asc' ? 1 : -1))
              .map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.Title}</TableCell>
                  <TableCell>{row.Dateiname}</TableCell>
                  <TableCell>{row.Auftragnummer}</TableCell>
                  <TableCell>
                    {row.Erstelltam
                      ? new Date(row.Erstelltam).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                      : ''}
                  </TableCell>
                  <TableCell>
                    {row.Ge_x00e4_ndertam
                      ? new Date(row.Ge_x00e4_ndertam).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                      : ''}
                  </TableCell>
                  <TableCell>{row.Auftraggeber}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={`Selected node: ${selectedNode ? selectedNode.value : 'None'}`}
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

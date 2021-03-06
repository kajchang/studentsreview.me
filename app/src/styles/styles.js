import { createStyles } from '@material-ui/styles';

export default createStyles(theme => ({
    root: {
        flexGrow: 1,
        margin: theme.spacing(2)
    },
    control: {
        padding: theme.spacing(2)
    },
    blockIcon: {
        display: 'block',
        margin: 'auto',
        fontSize: '100px'
    },
    scalingText: {
        fontSize: '1.8vw',
        [theme.breakpoints.up('sm')]: {
            fontSize: '0.9vw'
        }
    }
}));

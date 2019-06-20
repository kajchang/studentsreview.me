import React, { Fragment, useEffect, useState, useRef } from 'react';
import {
    ClickAwayListener,
    IconButton,
    Paper,
    MenuItem,
    Popper,
    Typography,
    withStyles,
    Grid,
} from '@material-ui/core'
import { withTheme } from '@material-ui/styles';
import { Close, MoreVert } from '@material-ui/icons'
import StarRatings from 'react-star-ratings';
import Modal from '../components/Modal';
import ReportForm from '../components/ReportForm';
import { isIOS } from 'react-device-detect';

import moment from 'moment';
import { hashReview, isMigrant } from '../utils';

import styles from '../styles/styles';

const Review = ({ classes, review, theme, teacher, selected }) => {
    const anchorEl = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [modalExposed, setModalExposed] = useState(false);

    useEffect(() => {
        if (selected) {
            anchorEl.current.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }, []);

    return (
        <div className={ classes.control } style={ {
            wordWrap: 'break-word',
            background: selected ? 'rgba(0, 0, 0, 0.14)' : 'inherit'
        } }>
            <IconButton style={ {
                float: 'right'
            } }
                buttonRef={ anchorEl }
                onClick={ () => setMenuOpen(!menuOpen) }
            >
                <MoreVert fontSize='small'/>
            </IconButton>
            <Popper
                anchorEl={ anchorEl.current }
                open={ menuOpen }
                onBlur={ () => setMenuOpen(false) }
            >
                <ClickAwayListener onClickAway={ () => setMenuOpen(false) }>
                    <Paper style={ {
                        padding: theme.spacing(1),
                        width: 200
                    } } onClick={ () => setMenuOpen(false) }>
                        <MenuItem onClick={ e => {
                            const textField = document.createElement('textarea');
                            e.target.appendChild(textField);
                            textField.innerText = `${ window.location.origin }${ window.location.pathname }#${ hashReview(review, teacher) }`;
                            if (isIOS) {
                                const range = document.createRange();
                                range.selectNodeContents(textField);
                                const selection = window.getSelection();
                                selection.removeAllRanges();
                                selection.addRange(range);
                                textField.setSelectionRange(0, 999999);
                            } else {
                                textField.select();
                            }
                            document.execCommand('copy');
                            textField.remove();
                        } }>
                            Copy Link
                        </MenuItem>
                        <MenuItem onClick={ () => setModalExposed(true) }>
                            Report
                        </MenuItem>
                    </Paper>
                </ClickAwayListener>
            </Popper>
            {
                !isMigrant(review) ? <Fragment>
                    <StarRatings
                        rating={ review.rating }
                        starRatedColor='gold'
                        starHoverColor='gold'
                        numberOfStars={ 5 }
                        starDimension={ theme.spacing(2.5) }
                        starSpacing={ theme.spacing(0.25) }
                    />
                    <Typography variant='caption' style={ {
                        marginLeft: theme.spacing(0.5)
                    } }>{ moment(review.timestamp).format('MMM Do YYYY') }</Typography>
                </Fragment> : <Typography variant='caption'>Restored from ratemyteachers.com</Typography>
            }
            <Typography variant='body1'>
                { review.text.replace(/Submitted by a student$/, '').replace(/Submitted by a Parent$/, '') }
            </Typography>
            <Modal shown={ modalExposed }>
                <Grid item xs={ 12 } sm={ 6 }>
                    <ClickAwayListener onClickAway={ () => setModalExposed(false) }>
                        <Paper className={ classes.control }>
                            <Close onClick={ () => setModalExposed(false) } style={ { cursor: 'pointer', float: 'right' } }/>
                            <ReportForm review={ review } teacher={ teacher } onClose={ () => setModalExposed(false) }/>
                        </Paper>
                    </ClickAwayListener>
                </Grid>
            </Modal>
        </div>
    );
}

export default withStyles(styles)(withTheme(Review));

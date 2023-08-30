import React, { Component } from 'react';
import { connectToStores } from 'tools/reflux-tools';
import Reports from 'components/reports';
import T from 'components/i18n';
import OpenModalButton from 'components/modal/open-modal-button';
import ReportsRow from './reports-row';
import ExpensesStore from './expenses-store';
import Actions from './expenses-actions';
import Box from 'react-bulma-components/lib/components/box';
import Heading from 'react-bulma-components/lib/components/heading';
import ExpensesFilter from './expenses-filter';
import ExpensesTotal from './expenses-total';

import { redirectTo } from 'tools/redirect-to';
import User from 'user/user-store';

import { isMobile } from 'react-device-detect';

const COLUMNS = [
  'reports-date',
  'reports-category',
  'reports-name',
  'reports-type',
  'reports-amount',
  'reports-balance',
  'reports-account',
  'reports-actions',
];

class Expenses extends Component {
  // початковий стан компонента. оскільки Null то прийматиме числові значення.
  state = {
    rows: null,
  };

  // constructor() {
  //     // this.addExpenses = this.addExpenses.bind(this);
  // }

  // При першому рендері запускаються фунції loadCategory() та load() з Actions
  componentDidMount() {
    Actions.loadCategory();
    Actions.load();
  }

  // Функція рендерить кусок розмітки з заголовком та кнопкою для створення однієї витрати
  emptyMessage() {
    return (
      <Box align="center">
        <Heading>{T('not-have-expenses')}</Heading>
        <OpenModalButton link="/expenses/add-expenses" text={T('add-expenses-btn')} />
      </Box>
    );
  }

  // componentWillReceiveProps(nprops) {
  //     const cfilter = this.props.filter;
  //     const nfilter = nprops.filter;

  //     if (cfilter.date !== nfilter.date || cfilter.slice !== nfilter.slice) {
  //         Sport.Actions.load(nfilter);
  //     }

  //     if (cfilter.status !== nfilter.status) {
  //         Sport.Actions.filter(nfilter);
  //     }
  // }

  // рендер розмітки для девайса з розміром вьюпорта еквівалентного десктопній версії додатка. В пропсі sales
  // прокидується тіло функції getExpenses (підозрюю з редакса чи з еквівалентної бібліотеки управління станом)
  renderTopDesktop() {
    return (
      <>
        <ExpensesFilter />
        <ExpensesTotal sales={ExpensesStore.getExpenses()} />
      </>
    );
  }

  // Аналогічно для вьюпорта мобілки.
  renderTopMobile() {
    return (
      <>
        <ExpensesTotal sales={ExpensesStore.getExpenses()} />
        <ExpensesFilter />
      </>
    );
  }

  //відповідає за рендер контенту
  renderView() {
    const props = this.props,
      emptyMessage = this.emptyMessage,
      size_button = isMobile ? 'small' : 'medium';

    return (
      <div className="expenses-page">
        {/* рендер  ExpensesTotal та ExpensesFilter відповідно до isMobile*/}
        {isMobile ? this.renderTopMobile() : this.renderTopDesktop()}
        <Box>
          <div className="ex-open-modal-wrapper">
            {/* Перелік кнопок для переходу на різні маршрути. Не розумію чому кнопки так називаються, 
            можливо це універсальний компонент який використовується ще десь*/}
            <OpenModalButton
              size={size_button}
              link="/transactions/move-funds"
              //елемент Т - інтернаціоналізація
              text={T('move-funds-btn')}
              icon="exchange-alt"
            />
            {/*<OpenModalButton size={size_button} link="/expenses/add-plan-expenses" text={T('add-plan-expenses-btn')} />*/}
            <OpenModalButton
              size={size_button}
              link="/expenses/add-expenses"
              color="danger"
              text={T('add-expenses-btn')}
              icon="minus-circle"
            />
            <OpenModalButton
              size={size_button}
              link="/expenses/add-funds"
              color="success"
              text={T('add-funds-btn')}
              icon="plus-circle"
            />
          </div>
          {/* Елемент з найголовнішим контентом в цьому рендері */}
          <Reports
            {...props}
            load={Actions.load}
            emptyMessage={emptyMessage}
            columns={COLUMNS}
            hideFooterOnEmpty
            rows={ExpensesStore.getExpenses()}
          >
            <ReportsRow role="row" />
          </Reports>
        </Box>
      </div>
    );
  }

  // головний рендер. перевіряє наявність getModuleEnable('payments') в User - якщо є, рендерить renderView/ немає - перенаправляє на маршрут /access-denied
  render() {
    return User.getModuleEnable('payments') ? this.renderView() : redirectTo('/access-denied');
  }
}

// експортуємо компонент для подальшого використання в іншій частині додатка.
export default connectToStores(Expenses, { _: ExpensesStore });

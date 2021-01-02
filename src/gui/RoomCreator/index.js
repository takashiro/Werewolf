import React from 'react';
import ReactDOM from 'react-dom';

import {
	Role,
	Team,
 } from '@asmodee/werewolf-core';

import Lobby from '../Lobby';
import TeamSelector from './TeamSelector';

import Toast from '../component/Toast';
import Room from '../Room';

import RoomConfig from '../../net/RoomConfig';
import {$client, net} from '../../net/Client';

export default class RoomCreator extends React.Component {

	constructor(props) {
		super(props);

		this.roleConfig = new Map;
		this.restoreConfig();

		this.handleChange = this.handleChange.bind(this);
		this.handleReturn = this.handleReturn.bind(this);
		this.handleConfirm = this.handleConfirm.bind(this);
	}

	restoreConfig() {
		if (!window.localStorage) {
			return;
		}

		let config = localStorage.getItem('room-config');
		if (!config) {
			return;
		}

		try {
			config = JSON.parse(config);
		} catch (e) {
			return;
		}

		if (!(config instanceof Array)) {
			return;
		}

		for (let item of config) {
			let role = Role.fromNum(item.role);
			if (role == Role.Unknown) {
				continue;
			}

			if (typeof item.value == 'number') {
				this.roleConfig.set(role.toNum(), Math.max(0, item.value));
			} else if (!!item.value) {
				this.roleConfig.set(role.toNum(), true);
			}
		}
	}

	saveConfig() {
		if (!window.localStorage) {
			return;
		}

		let config = [];
		this.roleConfig.forEach((value, key) => {
			config.push({
				role: key,
				value: value
			});
		});
		localStorage.setItem('room-config', JSON.stringify(config));
	}

	handleChange(data) {
		if (!data.role || data.role == Role.Unknown) {
			return;
		}
		if (typeof data.selected == 'boolean') {
			this.roleConfig.set(data.role.toNum(), data.selected);
		} else if (typeof data.value == 'number') {
			this.roleConfig.set(data.role.toNum(), Math.max(0, data.value));
		}
	}

	handleReturn() {
		ReactDOM.render(
			<Lobby />,
			document.getElementById('root')
		);
	}

	handleConfirm() {
		this.saveConfig();

		let roles = [];
		this.roleConfig.forEach((value, role) => {
			if (typeof value == 'number') {
				for (let i = 0; i < value; i++) {
					roles.push(role);
				}
			} else if (value) {
				roles.push(role);
			}
		});

		if (roles.length <= 0) {
			return Toast.makeToast('请选择角色。 ');
		} else if (roles.length > 50) {
			return Toast.makeToast('最大仅支持50人局，请重新配置角色。');
		}

		$client.post(net.Room, {roles: roles})
		.then(function (result) {
			let config = new RoomConfig(result);
			config.writeSession({
				ownerKey: result.ownerKey
			});

			ReactDOM.render(
				<Room config={config} />,
				document.getElementById('root')
			);
		})
		.catch(function (error) {
			alert(error.message);
		});
	}

	render() {
		return <div className="room-creator">
			<TeamSelector
				team={Team.Werewolf}
				basic={Role.Werewolf}
				config={this.roleConfig}
				onChange={this.handleChange}
			/>
			<TeamSelector
				team={Team.Villager}
				basic={Role.Villager}
				config={this.roleConfig}
				onChange={this.handleChange}
			/>
			<TeamSelector
				team={Team.Other}
				config={this.roleConfig}
				onChange={this.handleChange}
			/>
			<div className="button-area">
				<button type="button" onClick={this.handleReturn}>返回</button>
				<button type="button" onClick={this.handleConfirm}>创建房间</button>
			</div>
		</div>;
	}
}

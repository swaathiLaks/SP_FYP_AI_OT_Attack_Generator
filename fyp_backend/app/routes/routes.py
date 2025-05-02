import os
import time
from flask import Blueprint, jsonify, request
import asyncio
import mysql.connector
import uuid
from app.modules.generate import generate_attack
from app.modules.add_data import receive_file, receive_link
from app.modules.send_to_caldera import update_caldera_thread, start_caldera_thread

routes = Blueprint('routes', __name__)

stored_scripts = {} 

def get_db_connection():
    try:
        return mysql.connector.connect(
            host='127.0.0.1',
            user='fypgrp6',
            password='fypgrp6sql',
            database='fyp-ai-db'
        )
    except mysql.connector.Error as err:
        return jsonify({"error": f"Database connection failed: {err}"}), 500

# BACKEND TEST START

@routes.route('/test', methods=['GET'])
def backend_test():
    return jsonify({"message": "Hello! Backend is working :)"}), 200

# BACKEND TEST END


# RAG RECEIVE DATA (VECTORDB) START

@routes.route('/vector/file', methods=['POST'])
def receive_rag_file():
    asyncio.run(receive_file(request.files.to_dict()))
    return jsonify({"message": "Files received successfully"}), 201

@routes.route('/vector/link', methods=['POST'])
def receive_rag_link():
    asyncio.run(receive_link(request.form.to_dict()))
    return jsonify({"message": "Links received successfully"}), 201

# RAG RECEIVE DATA (VECTORDB) END 


# SEND FILE TO CALDERA START

@routes.route('/caldera/send', methods=['POST'])
def send_file_to_caldera():
    try:
        update_caldera_thread(request.json.get('script'))
        return jsonify({"message": "File sent to Caldera. Please wait."}), 200
    except Exception as e:
        return jsonify({"error": f"Error sending file to Caldera: {str(e)}"}), 500

# SEND FILE TO CALDERA END


# GET USERS START

@routes.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, username, email, status
            FROM users
        """)
        users = cursor.fetchall()

        cursor.close()
        conn.close()

        if users:
            return jsonify({"message": "Users retrieved successfully", "users": users}), 200
        else:
            return jsonify({"message": "No users found"}), 404

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error retrieving users: {str(e)}"}), 500

# GET USERS END


# LOGIN START

@routes.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        conn = get_db_connection()
        print(f"Connection type: {type(conn)}")
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, username, email, status
            FROM users
            WHERE email = %s
        """, (email,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user:
            return jsonify({"message": "Login successful", "user": user}), 200
        else:
            return jsonify({"error": "Email does not exist"}), 404

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error logging in: {str(e)}"}), 500 


# LOGIN END


# GENERATION START

@routes.route('/api/generate', methods=['POST'])
def api_generate_attack():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        generated_scripts = asyncio.run(generate_attack(data, user_id))

        if len(generated_scripts) > 0:

            stored_scripts[user_id] = generated_scripts

            scripts_response = {
                "scripts": [
                    {
                        "script_id": script["script_id"], 
                        "name": script["name"],
                        "script": script["script"],
                        "explanation": script["explanation"]
                    } for script in generated_scripts.values()
                ]
            }
            return jsonify(scripts_response), 200
        
        return jsonify({"error": "Failed to generate scripts"}), 500
    except Exception as e:
        return jsonify({"error": f"Error generating attack script: {str(e)}"}), 500

# GENERATION END


# SAVE SCRIPTS START

@routes.route('/api/save-script/<string:script_id>', methods=['POST'])
def save_script(script_id):
    data = request.json
    user_id = data.get('user_id')
    name = data.get('name')
    script = data.get('script')
    explanation = data.get('explanation')

    if not all([user_id, name, script, explanation]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("START TRANSACTION")

        cursor.execute(""" 
            INSERT INTO attack_scripts (script_id, name, script, explanation, user_id) 
            VALUES (%s, %s, %s, %s, %s)
        """, (script_id, name, script, explanation, user_id))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Script saved successfully"}), 200

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({"error": f"Database error: {err}"}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Error saving script: {str(e)}"}), 500

# SAVE SCRIPTS END


# GET SCRIPTS START

@routes.route('/api/saved-scripts/<int:user_id>', methods=['GET'])
def get_saved_scripts(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT script_id, name, script, explanation, created_at 
            FROM attack_scripts 
            WHERE user_id = %s
        """, (user_id,))
        scripts = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(scripts), 200

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error fetching saved scripts: {str(e)}"}), 500
    
# GET SCRIPTS END    


# GET ATTACK VECTORS START  

@routes.route('/api/attack-vectors', methods=['GET'])
def get_attack_vectors():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Query to fetch attack vectors (id, attack, selected)
        cursor.execute("""
            SELECT id, attack, selected 
            FROM attacks
        """)
        attack_vectors = cursor.fetchall()

        cursor.close()
        conn.close()

        # Format response as desired
        response = [
            {
                "id": attack["id"],
                "attack": attack["attack"],
                "selected": attack["selected"]
            }
            for attack in attack_vectors
        ]

        return jsonify(response), 200

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error fetching attack vectors: {str(e)}"}), 500
    
# GET ATTACK VECTORS END


# GET TARGETS START  

@routes.route('/api/targets', methods=['GET'])
def get_targets():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Query to fetch targets (id, name, selected)
        cursor.execute("""
            SELECT id, target, ip_address, selected 
            FROM targets
        """)
        targets = cursor.fetchall()

        cursor.close()
        conn.close()

        # Format response as desired
        response = [
            {
                "id": target["id"],
                "target": target["target"],
                "ip_address": target["ip_address"],
                "selected": target["selected"]
            }
            for target in targets
        ]

        return jsonify(response), 200

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error fetching targets: {str(e)}"}), 500

# GET TARGETS END


# UPDATE ATTACK VECTORS START
        
@routes.route('/api/attack-vectors', methods=['PUT'])
def update_attack_names():
    data = request.json
    attack_options = data.get('attack-options')

    # Validate input
    if not attack_options:
        return jsonify({"error": "Missing 'attack-options' in the request"}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Loop through each attack option and update the name
        for option in attack_options:
            attack_id = option.get('id')
            new_name = option.get('new-name')
            selected = option.get('selected')

            # Validate if both id and new-name are provided
            if not attack_id or not new_name:
                return jsonify({"error": "Both 'id' and 'new-name' are required for each attack option"}), 400

            # Update the name for the given attack ID
            cursor.execute("""
                UPDATE attacks
                SET attack = %s, selected = %s
                WHERE id = %s
            """, (new_name, selected, attack_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Attack vectors updated successfully"}), 200

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error updating attack vectors: {str(e)}"}), 500
    
# UPDATE ATTACK VECTORS END


# UPDATE TARGETS START

@routes.route('/api/targets', methods=['PUT'])
def update_target_info():
    data = request.json
    targets_info = data.get('attack-targets')

    if not targets_info:
        return jsonify({"error": "No target information provided"}), 400

    if not isinstance(targets_info, list) or not all(isinstance(t, dict) for t in targets_info):
        return jsonify({"error": "Invalid payload format for attack-targets"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update the target name, IP address, and selected status
        for target in targets_info:
            target_id = target.get('id')
            target_name = target.get('target')
            ip_address = target.get('ip_address')
            selected = target.get('selected')

            # Validate each target's fields
            if target_id is None or not target_name or not ip_address or selected is None:
                return jsonify({"error": f"Missing data for target ID {target_id}"}), 400

            # Execute the update query
            cursor.execute("""
                UPDATE targets
                SET target = %s, ip_address = %s, selected = %s
                WHERE id = %s
            """, (target_name, ip_address, selected, target_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Target information updated successfully"}), 200

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return jsonify({"error": f"Database error: {err}"}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": f"Error updating targets: {str(e)}"}), 500


# UPDATE TARGETS END